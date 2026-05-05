import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export const api = axios.create({ baseURL: BASE })

export const getSensors = () => api.get('/sensors')
export const getSensorValue = (webid) => api.get(`/sensors/${webid}/value`)
export const runAnalysis = (data) => api.post('/analyze', data)
export const runFacilityAudit = (data) => api.post('/analyze/facility', data)