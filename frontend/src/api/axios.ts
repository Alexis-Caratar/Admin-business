import axios from "axios";

//const API_URL = "http://localhost:4000/api"; // local
const API_URL = "http://192.168.80.19:4000/api"; // cesmag

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;
