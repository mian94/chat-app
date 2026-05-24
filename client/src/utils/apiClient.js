import axios from "axios";
import { host } from "./APIRoutes";
import { REQUEST_TIMEOUT_MS } from "../constants/app";

const apiClient = axios.create({
  baseURL: host,
  timeout: REQUEST_TIMEOUT_MS,
});

export function getErrorMessage(error, fallbackMessage = "Request failed, please try again later.") {
  if (error.code === "ECONNABORTED") {
    return "Request timed out, please check the network and try again.";
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.msg ||
    error.message ||
    fallbackMessage
  );
}

export default apiClient;
