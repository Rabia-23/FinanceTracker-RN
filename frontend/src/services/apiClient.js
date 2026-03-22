import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/api';

const apiClient = axios.create({
   baseURL: BASE_URL,
   timeout: 10000,
   headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
   const token = await AsyncStorage.getItem('finance_token');
   if (token) config.headers.Authorization = `Bearer ${token}`;
   return config;
}, (err) => Promise.reject(err));

apiClient.interceptors.response.use(
   (res) => res,
   async (err) => {
      if (err.response?.status === 401) {
         await AsyncStorage.multiRemove(['finance_token', 'finance_user']);
      }
      return Promise.reject(err);
   }
);

export default apiClient;