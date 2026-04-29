import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:5001/api', withCredentials: true });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export default API;