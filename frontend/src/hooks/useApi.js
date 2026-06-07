import { useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const useApi = () => {
  const { token, logout } = useContext(AuthContext);

  const api = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add token
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle 401
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export default useApi;
