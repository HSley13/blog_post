import { makeRequest } from "./makeRequest";

export const getTags = async () => {
  const response = await makeRequest({
    url: "/tags",
  });
  return response;
};

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
  tags?: string[];
};
export const createPost = async ({
  userId,
  title,
  body,
  file,
  tags,
}: createPostProps) => {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("title", title);
  formData.append("body", body);
  if (file) {
    formData.append("image", file);
  }

  tags?.forEach((tag) => {
    formData.append("tags[]", tag);
  });

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
  id: string | undefined;
  title: string;
  body: string;
  file?: File;
  tags?: string[];
};
export const updatePost = async ({
  id,
  title,
  body,
  file,
  tags,
}: updatePostProps) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("body", body);
  if (file) {
    formData.append("image", file);
  }

  tags?.forEach((tag) => {
    formData.append("tags[]", tag);
  });

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
