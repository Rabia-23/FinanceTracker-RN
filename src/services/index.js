import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

// ─────────── AUTH ─────────── //
export const loginUser = (email, password) => apiClient.post(ENDPOINTS.LOGIN, { email, password }).then(r => r.data);

export const registerUser = (username, email, password) => apiClient.post(ENDPOINTS.REGISTER, { username, email, password }).then(r => r.data);