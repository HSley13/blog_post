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

type createPostProps = {
  userId: string;
  title: string;
  body: string;
};
export const createPost = async ({ userId, title, body }: createPostProps) => {
  const response = await makeRequest({
    url: "/posts/",
    options: {
      method: "POST",
      data: { userId, title, body },
    },
  });
  return response;
};

type updatePostProps = {
  id: string;
  title: string;
  body: string;
};
export const updatePost = async ({ id, title, body }: updatePostProps) => {
  const response = await makeRequest({
    url: `/posts/${id}`,
    options: {
      method: "PUT",
      data: { title, body },
    },
  });
  return response;
};

type deletePostProps = {
  id: string;
};
export const deletePost = async ({ id }: deletePostProps) => {
  const response = await makeRequest({
    url: `/posts/${id}`,
    options: {
      method: "DELETE",
    },
  });
  return response;
};

type togglePostLikeProps = {
  id: string;
};
export const togglePostLike = async ({ id }: togglePostLikeProps) => {
  const response = await makeRequest({
    url: `/posts/${id}/toggleLike`,
    options: {
      method: "POST",
    },
  });
  return response;
};
