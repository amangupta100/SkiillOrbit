import axios from 'axios'

const API2 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL2,
  withCredentials: true,
});

export default API2