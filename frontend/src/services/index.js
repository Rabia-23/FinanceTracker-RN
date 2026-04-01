import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

// ─── AUTH ───
export const loginUser    = (email, password)           => apiClient.post(ENDPOINTS.LOGIN,    { email, password }).then(r => r.data);
export const registerUser = (username, email, password) => apiClient.post(ENDPOINTS.REGISTER, { username, email, password }).then(r => r.data);

// ─── HOME ───
export const getHomeData = () => apiClient.get(ENDPOINTS.HOME_ME).then(r => r.data);

// ─── ACCOUNTS ───
export const getAccounts   = (userId) => apiClient.get(`${ENDPOINTS.ACCOUNTS}/${userId}`).then(r => r.data);
export const createAccount = (dto)    => apiClient.post(ENDPOINTS.ACCOUNTS, dto).then(r => r.data);
export const deleteAccount = (id)     => apiClient.delete(`${ENDPOINTS.ACCOUNTS}/${id}`).then(r => r.data);

// ─── TRANSACTIONS ───
// createTransaction, updateTransaction, deleteTransaction Hafta 5'te eklenecek
export const getTransactions = (userId) => apiClient.get(`${ENDPOINTS.TRANSACTIONS}/${userId}`).then(r => r.data);

// ─── BUDGETS ───
export const getBudgets   = (userId) => apiClient.get(`${ENDPOINTS.BUDGETS}/${userId}`).then(r => r.data);
export const createBudget = (dto)    => apiClient.post(ENDPOINTS.BUDGETS, dto).then(r => r.data);
export const updateBudget = (id,dto) => apiClient.put(`${ENDPOINTS.BUDGETS}/${id}`, dto).then(r => r.data);
export const deleteBudget = (id)     => apiClient.delete(`${ENDPOINTS.BUDGETS}/${id}`).then(r => r.data);