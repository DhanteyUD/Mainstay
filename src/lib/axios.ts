import axios from "axios";

export const api = axios.create({
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? "Request failed";
    return Promise.reject(new Error(message));
  },
);
