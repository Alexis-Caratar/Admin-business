import axios from "./axios";

interface LoginPayload {
  email: string;
  password: string;
}

export const login = async (payload: LoginPayload) => {
  const { data } = await axios.post("/auth/login", payload);
  return data; // { token, user }
};

export const register = async (payload: any) => {
  const { data } = await axios.post("/auth/register", payload);
  return data;
};
