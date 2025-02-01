import { useParams } from "react-router-dom";
import React, { createContext, useMemo, useContext } from "react";
import { useAsync } from "../hooks/useAsync";
import { getPost } from "../services/posts";

type Comment = {
  id: string;
  message: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  parentId: string | null;
  user: {
    id: string;
    name: string;
  };
};

type Post = {
  id: string;
  title: string;
  body: string;
  comments: Comment[];
};

type PostContextValue = {
  post: Post | undefined;
  loading: boolean;
  error: Error | undefined;
  getReplies: (parentId: string | null) => Comment[] | undefined;
  rootComments: Comment[] | undefined;
};

const Context = createContext<PostContextValue>({
  post: undefined,
  loading: false,
  error: undefined,
});

export const usePostContext = () => useContext(Context);

type PostProviderProps = {
  children: React.ReactNode;
};

export const PostProvider = ({ children }: PostProviderProps) => {
  const { id } = useParams<{ id: string }>();
  const { loading, error, value: post } = useAsync(() => getPost(id), [id]);

  if (post?.comments === null) return [];

  const commentsByParentId = useMemo(() => {
    const group = {};

    post?.comments.forEach((comment) => {
      group[comment.parentId] = group[comment.parentId] || [];
      group[comment.parentId].push(comment);
    });

    return group;
  }, [post?.comments]);

  const getReplies = (parentId: string | null) => {
    return commentsByParentId[parentId];
  };

  return (
    <Context.Provider
      value={{
        post,
        getReplies,
        rootComments: commentsByParentId[null],
        loading,
        error,
      }}
    >
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error.message}</div>
      ) : (
        children
      )}
    </Context.Provider>
  );
};
