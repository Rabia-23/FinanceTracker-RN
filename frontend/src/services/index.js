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
export const getTransactions = (userId)   => apiClient.get(`${ENDPOINTS.TRANSACTIONS}/${userId}`).then(r => r.data);
export const createTransaction = (dto)    => apiClient.post(ENDPOINTS.TRANSACTIONS, dto).then(r => r.data);
export const updateTransaction = (id,dto) => apiClient.put(`${ENDPOINTS.TRANSACTIONS}/${id}`, dto).then(r => r.data);
export const deleteTransaction = (id)     => apiClient.delete(`${ENDPOINTS.TRANSACTIONS}/${id}`).then(r => r.data);

// ─── SUBSCRIPTIONS ───
export const getSubscriptions   = (userId)      => apiClient.get(`${ENDPOINTS.SUBSCRIPTIONS}/${userId}`).then(r => r.data);
export const createSubscription = (dto)          => apiClient.post(ENDPOINTS.SUBSCRIPTIONS, dto).then(r => r.data);
export const deleteSubscription = (id)           => apiClient.delete(`${ENDPOINTS.SUBSCRIPTIONS}/${id}`).then(r => r.data);
export const paySubscription    = (id, dto)      => apiClient.post(`${ENDPOINTS.SUBSCRIPTIONS}/${id}/pay`, dto).then(r => r.data);
export const skipSubscription   = (id)           => apiClient.post(`${ENDPOINTS.SUBSCRIPTIONS}/${id}/skip`, {}).then(r => r.data);

// ─── BUDGETS ───
export const getBudgets   = (userId) => apiClient.get(`${ENDPOINTS.BUDGETS}/${userId}`).then(r => r.data);
export const createBudget = (dto)    => apiClient.post(ENDPOINTS.BUDGETS, dto).then(r => r.data);
export const updateBudget = (id,dto) => apiClient.put(`${ENDPOINTS.BUDGETS}/${id}`, dto).then(r => r.data);
export const deleteBudget = (id)     => apiClient.delete(`${ENDPOINTS.BUDGETS}/${id}`).then(r => r.data);

// ─── CURRENCY ───
export const getCurrency = () => apiClient.get(ENDPOINTS.CURRENCY).then(r => r.data);

// ─── GOALS ───
export const getGoals         = (userId)    => apiClient.get(`${ENDPOINTS.GOALS}/${userId}`).then(r => r.data);
export const createGoal       = (dto)       => apiClient.post(ENDPOINTS.GOALS, dto).then(r => r.data);
export const deleteGoal       = (id)        => apiClient.delete(`${ENDPOINTS.GOALS}/${id}`).then(r => r.data);
export const contributeToGoal = (id, dto)   => apiClient.post(`${ENDPOINTS.GOALS}/${id}/contribute`, dto).then(r => r.data);