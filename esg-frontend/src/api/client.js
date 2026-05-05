import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001'
const PI_BASE = import.meta.env.VITE_PI_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE })
export const piApi = axios.create({ baseURL: PI_BASE })

// Wake up Render servers on app load
export const wakeUpServers = async () => {
  try {
    await Promise.all([
      api.get('/sensors'),
      piApi.get('/')
    ])
  } catch {
    // silently fail — just a wake-up ping
  }
}

export const getSensors = () => api.get('/sensors')
export const getSensorValue = (webid) => api.get(`/sensors/${webid}/value`)
export const runAnalysis = (data) => api.post('/analyze', data)
export const runFacilityAudit = (data) => api.post('/analyze/facility', data)