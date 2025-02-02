import { makeRequest } from "./makeRequest";

type CreatCommentProps = {
  postId: string;
  message: string;
  parentId?: string;
};

export const createComment = async ({
  postId,
  message,
  parentId,
}: CreatCommentProps) => {
  const response = await makeRequest({
    url: `posts/${postId}/comments`,
    options: {
      method: "POST",
      data: { message, parentId, postId },
    },
  });
  return response;
};
