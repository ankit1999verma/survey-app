import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const PENDING_SURVEYS_KEY = 'pendingSurveys';
const MASTER_DATA_KEY = 'masterData';

export const saveSurveyOffline = async (surveyData) => {
  try {
    const existingStr = await AsyncStorage.getItem(PENDING_SURVEYS_KEY);
    const surveys = existingStr ? JSON.parse(existingStr) : [];
    
    // Add UUID for tracking
    const newSurvey = { ...surveyData, uuid: uuidv4(), savedAt: new Date().toISOString() };
    surveys.push(newSurvey);
    
    await AsyncStorage.setItem(PENDING_SURVEYS_KEY, JSON.stringify(surveys));
    return newSurvey;
  } catch (error) {
    console.error('Error saving survey offline', error);
    throw error;
  }
};

export const getPendingSurveys = async () => {
  try {
    const existingStr = await AsyncStorage.getItem(PENDING_SURVEYS_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (error) {
    console.error('Error getting pending surveys', error);
    return [];
  }
};

export const clearPendingSurveys = async () => {
  await AsyncStorage.removeItem(PENDING_SURVEYS_KEY);
};

export const syncSurveys = async () => {
  try {
    const pending = await getPendingSurveys();
    if (pending.length === 0) return { count: 0, status: 'No pending surveys' };

    const res = await api.post('/survey/submit', pending);
    
    if (res.status === 201) {
      await clearPendingSurveys();
      return { count: pending.length, status: 'Success' };
    }
    
    return { count: 0, status: 'Server error' };
  } catch (error) {
    console.error('Sync failed', error);
    throw error;
  }
};

export const syncMasterData = async () => {
  try {
    const res = await api.get('/master/sync');
    if (res.data) {
      await AsyncStorage.setItem(MASTER_DATA_KEY, JSON.stringify(res.data));
      return res.data;
    }
  } catch (error) {
    console.error('Failed to fetch master data', error);
    throw error;
  }
};

export const getMasterData = async () => {
  try {
    const dataStr = await AsyncStorage.getItem(MASTER_DATA_KEY);
    return dataStr ? JSON.parse(dataStr) : null;
  } catch (error) {
    console.error('Error getting master data', error);
    return null;
  }
};
