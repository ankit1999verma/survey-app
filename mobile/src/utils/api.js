import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your local machine's IP address when testing on a real device
// e.g., 'http://192.168.1.176:5000/api'
const BASE_URL = 'http://13.204.243.30/api';

const api = axios.create({
  baseURL: BASE_URL,
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
