import axios from 'axios'
import { getToken } from '../state/AuthContext.jsx'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050',
  timeout: 20000
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const login = (body) => api.post('/api/auth/login', body).then(r => r.data)
export const register = (body) => api.post('/api/auth/register', body).then(r => r.data)

// Admin: Farmers
export const getFarmers = () => api.get('/api/admin/farmers').then(r => r.data)
export const createFarmer = (body) => api.post('/api/admin/farmers', body).then(r => r.data)
export const verifyFarmer = (farmerId) => api.post(`/api/admin/verify/${farmerId}`).then(r => r.data)
export const verifyAllFarmers = () => api.post('/api/admin/verify-all').then(r => r.data)

// Farmer: Devices
export const getDevices = (farmerId) => api.get('/api/devices', { params: { farmerId } }).then(r => r.data)
export const addDevice = (body) => api.post('/api/devices', body).then(r => r.data)
export const deleteDevice = (id) => api.delete(`/api/devices/${id}`).then(r => r.data)

export default api
