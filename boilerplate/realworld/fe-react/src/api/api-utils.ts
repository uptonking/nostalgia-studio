import { jwtDecode } from 'jwt-decode';

import { axios } from '@datalking/toolkitjs';

import { API_MAIN_SERVER } from '../utils/constants';

export const JWT_TOKEN_KEY = 'jwtTokenKey2024';

axios.defaults.baseURL = API_MAIN_SERVER;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (token) {
      // config.headers['Authorization'] = token ? `Bearer ${token}` : '';
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    switch (error.response.status) {
      case 401:
        // navigate('/register');
        break;
      case 404:
      case 403:
        // navigate('/');
        break;
    }
    return Promise.reject(error.response);
  },
);

// export function setToken(token: string | null) {
//   if (token) {
//     axios.defaults.headers.common['Authorization'] = `Token ${token}`;
//   } else {
//     delete axios.defaults.headers.common['Authorization'];
//   }
// }

type JWTPayload = {
  id: string;
  username: string;
  exp: number;
};

export function isTokenValidForTest(token: string) {
  return token.startsWith('--test--');
}

export function isTokenValid(token: string) {
  try {
    const decoded_jwt: JWTPayload = jwtDecode(token);
    const current_time = Date.now().valueOf() / 1000;
    return decoded_jwt.exp > current_time;
  } catch (error) {
    console.error('AUTH TOKEN not valid');
    return false;
  }
}

export default axios;
