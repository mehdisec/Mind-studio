import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token & custom Gemini AI headers to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mindmap_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach configured AI Key and Model if present
  try {
    const rawSettings = localStorage.getItem('mindmap_studio_settings');
    if (rawSettings && config.headers) {
      const parsed = JSON.parse(rawSettings);
      if (parsed.geminiApiKey) {
        config.headers['x-gemini-api-key'] = parsed.geminiApiKey;
      }
      if (parsed.geminiModel) {
        config.headers['x-gemini-model'] = parsed.geminiModel;
      }
    }
  } catch (e) {
    // ignore json parse error
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      // localStorage.removeItem('mindmap_token');
    }
    return Promise.reject(error);
  }
);
