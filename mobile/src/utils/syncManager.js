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

import axios from 'axios';

export const syncSurveys = async () => {
  const pending = await getUnsyncedSurveys();
  if (pending.length === 0) return { count: 0, status: 'Nothing to sync' };

  const formattedPending = [];
  for (const s of pending) {
    let finalPhotoData = s.photoBase64;
    if (s.photoBase64) {
      try {
        const photos = JSON.parse(s.photoBase64);
        if (Array.isArray(photos)) {
          const uploadedUrls = [];
          for (const b64 of photos) {
            if (b64.startsWith('http')) {
              uploadedUrls.push(b64);
            } else {
              const formData = new FormData();
              formData.append("base64File", b64);
              const upRes = await axios.post('https://upm.tivarax.in/api/upm/file/upload/base64', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              // The API returns the URL as plain string
              uploadedUrls.push(upRes.data);
            }
          }
          finalPhotoData = JSON.stringify(uploadedUrls);
        }
      } catch (e) {
        console.warn('Failed to upload photos to external bucket', e);
      }
    }

    formattedPending.push({
      ...s,
      photoBase64: finalPhotoData,
      createdAt: s.createdAt ? s.createdAt.replace(' ', 'T') : undefined,
      syncedAt: s.syncedAt ? s.syncedAt.replace(' ', 'T') : undefined,
    });
  }

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
    const CONCURRENCY = 2; // Reduced to avoid overwhelming server
    const MAX_RETRIES = 5;

    // 2. Process queue with exponential backoff retries
    let i = 0;
    const processNext = async () => {
      while (i < chunks.length) {
        const chunk = chunks[i++];
        let success = false;
        let retries = MAX_RETRIES;
        let delay = 1000;
        while (!success && retries > 0) {
          try {
            const res = await api.get(`${endpoint}?startId=${chunk.startId}&endId=${chunk.endId}`, { timeout: 60000 });
            const { content } = res.data;
            if (content && content.length > 0) {
              await onChunk(content);
              totalFetched += content.length;
            }
            chunksProcessed++;
            if (onProgress) onProgress({ step, done: chunksProcessed, total: chunks.length });
            success = true;
          } catch (e) {
            retries--;
            if (retries === 0) {
              // Skip failed chunk — don't crash entire sync
              console.warn(`Skipping ${endpoint} chunk ${chunk.startId}-${chunk.endId} after ${MAX_RETRIES} retries:`, e?.message);
              chunksProcessed++;
              if (onProgress) onProgress({ step, done: chunksProcessed, total: chunks.length });
            } else {
              await new Promise(r => setTimeout(r, delay));
              delay = Math.min(delay * 2, 8000); // exponential backoff, max 8s
            }
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

  // Run blocks first (smaller dataset), then GPs sequentially to avoid memory pressure
  const blockCount = await fetchChunksInParallel('/master/blocks', blockMaxId, maxBlockId || 0, 'blocks', 2000, async (chunk) => {
    await saveMasterChunk({ states: [], districts: [], blocks: chunk, gramPanchayats: [] });
  });

  // GPs are huge (265k+), process with smaller chunks
  const gpCount = await fetchChunksInParallel('/master/gps', gpMaxId, maxGpId || 0, 'gps', 2000, async (chunk) => {
    await saveMasterChunk({ states: [], districts: [], blocks: [], gramPanchayats: chunk });
  });

  console.log(`Sync complete: ${blockCount} blocks, ${gpCount} GPs`);
  // Return the full local dataset
  return loadMasterData();
};
