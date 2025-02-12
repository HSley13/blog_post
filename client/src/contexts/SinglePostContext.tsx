import { useParams } from "react-router-dom";
import React, { createContext, useMemo, useContext } from "react";
import { Container, Spinner } from "react-bootstrap";
import { Comment, Post } from "../types/types";
import { useAllPostsContext } from "../contexts/AllPostsContext";

type SinglePostContextValue = {
  post: Post | undefined;
  loading: boolean;
  error: Error | undefined;
  getReplies: (parentId: string | null) => Comment[] | undefined;
  rootComments: Comment[] | undefined;
};

const Context = createContext<SinglePostContextValue>({
  post: undefined,
  loading: false,
  error: undefined,
  getReplies: () => [],
  rootComments: [],
});

export const useSinglePostContext = () => useContext(Context);

type SinglePostProviderProps = {
  children: React.ReactNode;
};
export const SinglePostProvider = ({ children }: SinglePostProviderProps) => {
  const { id } = useParams<{ id: string }>();
  const { loading, error, posts } = useAllPostsContext();

  const post = useMemo(() => {
    return posts.find((post) => post.id === id);
  }, [id, posts]);

  const commentsByParentId = useMemo(() => {
    const group: { [key: string | null]: Comment[] } = {};

    if (post?.comments) {
      post.comments.forEach((comment) => {
        const parentId = comment.parentId || null;
        group[parentId] = group[parentId] || [];
        group[parentId].push(comment);
      });
    }

    return group;
  }, [post?.comments]);

  const getReplies = (parentId: string | null) => {
    return commentsByParentId[parentId];
  };

  return (
    <Context.Provider
      value={{
        post: post ? { id, ...post } : undefined,
        getReplies,
        rootComments: commentsByParentId[null],
        loading,
        error,
      }}
    >
      {loading ? (
        <Container className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h1>Loading...</h1>
        </Container>
      ) : error ? (
        <Container className="text-center my-5">
          <h1>{error.message}</h1>
        </Container>
      ) : (
        children
      )}
    </Context.Provider>
  );
};
