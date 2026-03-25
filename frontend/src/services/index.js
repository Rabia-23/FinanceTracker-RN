import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

// ───────── AUTH ─────────
export const loginUser    = (email, password)           => apiClient.post(ENDPOINTS.LOGIN,    { email, password }).then(r => r.data);

export const registerUser = (username, email, password) => apiClient.post(ENDPOINTS.REGISTER, { username, email, password }).then(r => r.data);

// ───────── ACCOUNTS ─────────
export const getAccounts   = (userId) => apiClient.get(`${ENDPOINTS.ACCOUNTS}/${userId}`).then(r => r.data);

export const createAccount = (dto)    => apiClient.post(ENDPOINTS.ACCOUNTS, dto).then(r => r.data);

export const deleteAccount = (id)     => apiClient.delete(`${ENDPOINTS.ACCOUNTS}/${id}`).then(r => r.data);