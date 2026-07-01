import api from './api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  insertSurvey, getUnsyncedSurveys, markSynced,
  saveMasterData, loadMasterData, getSurveyCounts,
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

  const res = await api.post('/survey/sync', pending);
  if (res.status === 200 || res.status === 201) {
    const syncedUuids = res.data.synced ?? pending.map(s => s.uuid);
    await markSynced(syncedUuids);
    return { count: syncedUuids.length, status: 'Success' };
  }
  return { count: 0, status: 'Server error' };
};

export const syncMasterData = async () => {
  const res = await api.get('/master/sync');
  if (res.data) {
    try { await saveMasterData(res.data); } catch (_) {}
    return res.data;
  }
  throw new Error('No master data received');
};
