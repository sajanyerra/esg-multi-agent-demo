import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const PI_URL = import.meta.env.VITE_PI_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function wakeUpServers() {
  try {
    await Promise.all([
      apiClient.get('/'),
      axios.get(PI_URL),
    ]).catch(() => {
      // Silently fail if servers aren't ready
    });
  } catch (err) {
    console.log('Servers warming up...');
  }
}

export const client = {
  get: async (endpoint) => {
    const res = await apiClient.get(endpoint);
    const data = res.data;

    // Handle PI Server response format: {"Items": [...]}
    if (data.Items && Array.isArray(data.Items)) {
      return data.Items;
    }

    // Handle flat array
    if (Array.isArray(data)) {
      return data;
    }

    // Handle agent API response
    if (data.report) {
      return data;
    }

    return data;
  },

  post: async (endpoint, payload) => {
    const res = await apiClient.post(endpoint, payload);
    return res.data;
  },

  put: async (endpoint, payload) => {
    const res = await apiClient.put(endpoint, payload);
    return res.data;
  },

  delete: async (endpoint) => {
    const res = await apiClient.delete(endpoint);
    return res.data;
  },
};

export default apiClient;