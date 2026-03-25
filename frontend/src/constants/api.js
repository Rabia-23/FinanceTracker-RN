// Backend çalışıyorsa port numarasını buraya yaz
// Telefonda test ediyorsan: http://192.168.x.x:PORT
export const BASE_URL = 'http://localhost:5182';

export const ENDPOINTS = {
  LOGIN:         '/api/Auth/login',
  REGISTER:      '/api/Auth/register',
  HOME_ME:       '/api/Home/me',
  ACCOUNTS:      '/api/Accounts',
  TRANSACTIONS:  '/api/Transactions',
  BUDGETS:       '/api/Budgets',
  SUBSCRIPTIONS: '/api/Subscriptions',
  GOALS:         '/api/Goals',
  CURRENCY:      '/api/Currency',
};
