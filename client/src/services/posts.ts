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
  file?: File;
};
export const createPost = async ({
  userId,
  title,
  body,
  file,
}: createPostProps) => {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("title", title);
  formData.append("body", body);
  if (file) {
    formData.append("image", file);
  }
  const response = await makeRequest({
    url: "/posts/",
    options: {
      method: "POST",
      data: formData,
    },
  });
  return response;
};

type updatePostProps = {
  id: string;
  title: string;
  body: string;
  file?: File;
};
export const updatePost = async ({
  id,
  title,
  body,
  file,
}: updatePostProps) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("body", body);
  if (file) {
    formData.append("image", file);
  }

  const response = await makeRequest({
    url: `/posts/${id}`,
    options: {
      method: "PUT",
      data: formData,
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
