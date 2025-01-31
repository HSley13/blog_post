import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

type MakeRequestProps = {
  url: string;
  options?: AxiosRequestConfig;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL,
  withCredentials: true,
});

export const makeRequest = async ({ url, options = {} }: MakeRequestProps) => {
  try {
    const response: AxiosResponse = await api(url, options);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const errorMessage =
        axiosError.response.data?.message || "An error occurred";
      return Promise.reject(errorMessage);
    } else if (axiosError.request) {
      return Promise.reject("No response received from the server");
    } else {
      return Promise.reject("An error occurred while setting up the request");
    }
  }
};
