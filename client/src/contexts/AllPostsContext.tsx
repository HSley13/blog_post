import React, { createContext, useEffect, useState, useContext } from "react";
import { useAsync } from "../hooks/useAsync";
import { getPosts, getTags } from "../services/posts";
import { Container, Spinner } from "react-bootstrap";
import { Post, Tag } from "../types/types";

type AllPostsContextValue = {
  posts: Post[] | undefined;
  tags: Tag[] | undefined;
  loading: boolean;
  error: Error | undefined;
  createLocalPost: (post: Post) => void;
  updateLocalPost: (
    id: string,
    title: string,
    body: string,
    updatedAt: string,
    imageUrl?: string,
    tags?: string[],
  ) => void;
  deleteLocalPost: (id: string) => void;
  toggleLocalPostLike: (id: string, addLike: boolean) => void;
};

const Context = createContext<AllPostsContextValue>({
  posts: undefined,
  tags: undefined,
  loading: false,
  error: undefined,
  createLocalPost: () => {},
  updateLocalPost: () => {},
  deleteLocalPost: () => {},
  toggleLocalPostLike: () => {},
});

export const useAllPostsContext = () => useContext(Context);

type AllPostsProviderProps = {
  children: React.ReactNode;
};

export const AllPostsProvider: React.FC<AllPostsProviderProps> = ({
  children,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const {
    loading: loadingPosts,
    error: errorPosts,
    value: allPosts,
  } = useAsync(getPosts);
  const {
    loading: loadingTags,
    error: errorTags,
    value: allTags,
  } = useAsync(getTags);

  const loading = loadingPosts || loadingTags;

  const error = errorPosts || errorTags;

  useEffect(() => {
    if (allTags) {
      setTags(allTags);
    }
  }, [allTags]);

  useEffect(() => {
    if (allPosts) {
      setPosts(allPosts);
    }
  }, [allPosts]);

  const createLocalPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const updateLocalPost = (
    id: string,
    title: string,
    body: string,
    updatedAt: string,
    imageUrl?: string,
    tags?: string[],
  ) => {
    setPosts((prevPosts: Post[]) =>
      prevPosts.map((post: Post) =>
        post.id === id
          ? { ...post, title, body, updatedAt, imageUrl, tags }
          : post,
      ),
    );
  };

  const deleteLocalPost = (id: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
  };

  const toggleLocalPostLike = (id: string, addLike: boolean) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              likeCount: post.likeCount + (addLike ? 1 : -1),
              likedByMe: addLike,
            }
          : post,
      ),
    );
  };

  return (
    <Context.Provider
      value={{
        posts,
        tags,
        loading,
        error,
        createLocalPost,
        updateLocalPost,
        deleteLocalPost,
        toggleLocalPostLike,
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
