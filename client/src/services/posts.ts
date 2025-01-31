import { makeRequest } from "./makeRequest";

export const getPosts = async () => {
  const response = await makeRequest({
    url: "/posts",
  });
  return response;
};
