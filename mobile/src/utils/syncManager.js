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

  // Fix date strings for Jackson LocalDateTime parsing (replace space with T)
  const formattedPending = pending.map(s => ({
    ...s,
    createdAt: s.createdAt ? s.createdAt.replace(' ', 'T') : undefined,
    syncedAt: s.syncedAt ? s.syncedAt.replace(' ', 'T') : undefined,
  }));

  const res = await api.post('/survey/sync', { surveys: formattedPending });
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

  // Step 2: States + districts (lite — always small) + max IDs
  const liteRes = await api.get(`/master/lite?afterStateId=${stateMaxId}&afterDistrictId=${districtMaxId}`);
  const { states, districts, maxBlockId, maxGpId } = liteRes.data;
  await saveMasterChunk({ states, districts, blocks: [], gramPanchayats: [] });
  if (onProgress) onProgress({ step: 'states', done: states.length, total: states.length });

  // Step 3 + 4: Fetch blocks and GPs using parallel predefined chunks
  const fetchChunksInParallel = async (endpoint, localMaxId, serverMaxId, step, chunkSize, onChunk) => {
    if (serverMaxId <= localMaxId) return 0;
    
    // 1. Generate predefined chunks
    const chunks = [];
    for (let id = localMaxId; id < serverMaxId; id += chunkSize) {
      chunks.push({ startId: id, endId: id + chunkSize });
    }
    
    let totalFetched = 0;
    let chunksProcessed = 0;
    const CONCURRENCY = 5;
    
    // 2. Process queue with retries
    let i = 0;
    const processNext = async () => {
      while (i < chunks.length) {
        const chunk = chunks[i++];
        let success = false;
        let retries = 3;
        while (!success && retries > 0) {
          try {
            const res = await api.get(`${endpoint}?startId=${chunk.startId}&endId=${chunk.endId}`);
            const { content } = res.data;
            if (content && content.length > 0) {
              await onChunk(content);
              totalFetched += content.length;
            }
            chunksProcessed++;
            // Approximate progress by chunks processed vs total chunks
            if (onProgress) onProgress({ step, done: chunksProcessed, total: chunks.length });
            success = true;
          } catch (e) {
            retries--;
            if (retries === 0) throw new Error(`Failed to fetch ${endpoint} chunk ${chunk.startId}-${chunk.endId}`);
            await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
          }
        }
      }
    };
    
    // 3. Fire parallel workers
    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) {
      workers.push(processNext());
    }
    await Promise.all(workers);
    return totalFetched;
  };

  // Run blocks and GPs in parallel
  const [blockCount, gpCount] = await Promise.all([
    fetchChunksInParallel('/master/blocks', blockMaxId, maxBlockId || 0, 'blocks', 5000, async (chunk) => {
      await saveMasterChunk({ states: [], districts: [], blocks: chunk, gramPanchayats: [] });
    }),
    fetchChunksInParallel('/master/gps', gpMaxId, maxGpId || 0, 'gps', 5000, async (chunk) => {
      await saveMasterChunk({ states: [], districts: [], blocks: [], gramPanchayats: chunk });
    }),
  ]);

  // Return the full local dataset
  return loadMasterData();
};
