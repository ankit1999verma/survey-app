import api from './api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  insertSurvey, getUnsyncedSurveys, markSynced,
  saveMasterChunk, loadMasterData, getSurveyCounts,
  getLocalMasterMaxIds,
} from './localDB';

export { loadMasterData as getMasterData, getSurveyCounts };

export const saveSurveyOffline = async (surveyData, userId) => {
  const survey = { uuid: uuidv4(), ...surveyData, userId: userId ?? null, synced: 0 };
  await insertSurvey(survey);
  return survey;
};

export const getPendingSurveys = async () => getUnsyncedSurveys();

export const syncSurveys = async () => {
  const pending = await getUnsyncedSurveys();
  if (pending.length === 0) return { count: 0, status: 'Nothing to sync' };

  const res = await api.post('/survey/sync', { surveys: pending });
  if (res.status === 200 || res.status === 201) {
    const syncedUuids = res.data.synced ?? pending.map(s => s.uuid);
    await markSynced(syncedUuids);
    return { count: syncedUuids.length, status: 'Success' };
  }
  return { count: 0, status: 'Server error' };
};

/**
 * Incremental + parallel master data sync.
 *
 * Strategy:
 * 1. Read local max IDs from SQLite (what we already have).
 * 2. Fetch states+districts in one lite call (small data).
 * 3. Fetch blocks cursor-paginated (10,000/call), starting after local max block ID.
 * 4. Fetch GPs cursor-paginated (10,000/call), starting after local max GP ID.
 *    Blocks + GPs are fetched IN PARALLEL while each saves to SQLite.
 *
 * @param {function} onProgress - called with { step, done, total }
 * @returns combined master data object
 */
export const syncMasterData = async (onProgress) => {
  // Step 1: Read what we already have
  const { stateMaxId, districtMaxId, blockMaxId, gpMaxId } = await getLocalMasterMaxIds();

  // Step 2: States + districts (lite — always small)
  const liteRes = await api.get(`/master/lite?afterStateId=${stateMaxId}&afterDistrictId=${districtMaxId}`);
  const { states, districts } = liteRes.data;
  await saveMasterChunk({ states, districts, blocks: [], gramPanchayats: [] });
  if (onProgress) onProgress({ step: 'states', done: states.length, total: states.length });

  // Step 3 + 4: Fetch blocks and GPs in parallel using cursor pagination
  const fetchAllCursor = async (endpoint, afterId, step, onChunk) => {
    let cursor = afterId;
    let totalFetched = 0;
    let totalElements = null;

    while (true) {
      const res = await api.get(`${endpoint}?afterId=${cursor}&size=5000`);
      const { content, hasMore, lastId, totalElements: te } = res.data;
      if (totalElements === null) totalElements = te + totalFetched; // approximate total

      if (!content || content.length === 0) break;

      await onChunk(content);
      totalFetched += content.length;
      cursor = lastId;

      if (onProgress) onProgress({ step, done: totalFetched, total: totalElements });
      if (!hasMore) break;
    }
    return totalFetched;
  };

  // Run blocks and GPs in parallel
  const [blockCount, gpCount] = await Promise.all([
    fetchAllCursor('/master/blocks', blockMaxId, 'blocks', async (chunk) => {
      await saveMasterChunk({ states: [], districts: [], blocks: chunk, gramPanchayats: [] });
    }),
    fetchAllCursor('/master/gps', gpMaxId, 'gps', async (chunk) => {
      await saveMasterChunk({ states: [], districts: [], blocks: [], gramPanchayats: chunk });
    }),
  ]);

  // Return the full local dataset
  return loadMasterData();
};
