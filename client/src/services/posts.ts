import { makeRequest } from "./makeRequest";

export const getPosts = async () => {
  const response = await makeRequest({
    url: "/posts",
  });
  return response;
};

export const getPost = async (id: string) => {
  const response = await makeRequest({
    url: `/posts/${id}`,
  });
  return response;
};
