import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

type MakeRequestProps = {
  url: string;
  options?: AxiosRequestConfig;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const makeRequest = async ({ url, options }: MakeRequestProps) => {
  try {
    const response: AxiosResponse = await api(url, options);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      // Handle error response from the server
      const responseData = axiosError.response.data;

      // Check if responseData is an object and has a 'message' property
      if (
        typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData
      ) {
        return Promise.reject(responseData.message);
      } else if (typeof responseData === "string") {
        // If the response data is a string, use it as the error message
        return Promise.reject(responseData);
      } else {
        // Fallback error message
        return Promise.reject("An error occurred");
      }
    } else if (axiosError.request) {
      // The request was made but no response was received
      return Promise.reject("No response received from the server");
    } else {
      // Something happened in setting up the request that triggered an error
      return Promise.reject("An error occurred while setting up the request");
    }
  }
};
