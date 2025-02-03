import { makeRequest } from "./makeRequest";

type CreateCommentProps = {
  postId: string;
  message: string;
  parentId?: string;
};
export const createComment = async ({
  postId,
  message,
  parentId,
}: CreateCommentProps) => {
  const response = await makeRequest({
    url: `posts/${postId}/comments`,
    options: {
      method: "POST",
      data: { message, parentId, postId },
    },
  });
  return response;
};

type UpdateCommentProps = {
  id: string;
  postId: string;
  message: string;
};
export const updateComment = async ({
  id,
  postId,
  message,
}: UpdateCommentProps) => {
  const response = await makeRequest({
    url: `posts/${postId}/comments/${id}`,
    options: {
      method: "PUT",
      data: { message },
    },
  });
  return response;
};

type DeleteCommentProps = {
  id: string;
  postId: string;
};
export const deleteComment = async ({ id, postId }: DeleteCommentProps) => {
  const response = await makeRequest({
    url: `posts/${postId}/comments/${id}`,
    options: {
      method: "DELETE",
    },
  });
  return response;
};

type ToggleCommentLikeProps = {
  id: string;
  postId: string;
};
export const toggleCommentLike = async ({
  id,
  postId,
}: ToggleCommentLikeProps) => {
  const response = await makeRequest({
    url: `posts/${postId}/comments/${id}/toggleLike`,
    options: {
      method: "POST",
    },
  });
  return response;
};
