import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - update this to match your backend environment
const BASE_URL = 'https://gpsurvey.tivarax.in/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s timeout per request
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API ERROR]', error.config?.url, error.code, error.message, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
