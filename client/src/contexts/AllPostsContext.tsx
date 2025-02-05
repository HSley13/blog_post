import React, { createContext, useEffect, useState, useContext } from "react";
import { useAsync } from "../hooks/useAsync";
// import { useWebSocket } from "../hooks/useWebsocket";
import { getPosts } from "../services/posts";
import { Container } from "react-bootstrap";
import { Post } from "../types/types";

type AllPostsContextValue = {
  posts: Post[] | undefined;
  loading: boolean;
  error: Error | undefined;
  createLocalPost: (post: Post) => void;
  updateLocalPost: (id: string, title: string, body: string) => void;
  deleteLocalPost: (id: string) => void;
};

const Context = createContext<AllPostsContextValue>({
  posts: undefined,
  loading: false,
  error: undefined,
  createLocalPost: () => {},
  updateLocalPost: () => {},
  deleteLocalPost: () => {},
});

export const useAllPostsContext = () => useContext(Context);

type AllPostsProviderProps = {
  children: React.ReactNode;
};

export const AllPostsProvider: React.FC<AllPostsProviderProps> = ({
  children,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { loading, error, value: allPosts } = useAsync(getPosts);

  useEffect(() => {
    if (allPosts) {
      setPosts(allPosts);
    }
  }, [allPosts]);

  // const wsUrl = import.meta.env.VITE_SOCKET_URL;
  // const { posts: wsPosts, comments: wsComments } = useWebSocket({
  //   url: wsUrl,
  // });
  //
  // useEffect(() => {
  //   setPosts((prevPosts) => {
  //     const newPosts = wsPosts.filter(
  //       (wsPost) => !prevPosts.some((post) => post.id === wsPost.id),
  //     );
  //     return [...newPosts, ...prevPosts];
  //   });
  // }, [wsPosts]);
  //
  // useEffect(() => {
  //   setPosts((prevPosts) => {
  //     return prevPosts.map((post) => {
  //       const newComments = wsComments.filter(
  //         (wsComment) => wsComment.postId === post.id,
  //       );
  //       if (newComments.length > 0) {
  //         return {
  //           ...post,
  //           comments: [...post.comments, ...newComments],
  //         };
  //       }
  //       return post;
  //     });
  //   });
  // }, [wsComments]);

  const createLocalPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const updateLocalPost = (id: string, title: string, body: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id ? { ...post, title, body } : post,
      ),
    );
  };

  const deleteLocalPost = (id: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
  };

  return (
    <Context.Provider
      value={{
        posts,
        loading,
        error,
        createLocalPost,
        updateLocalPost,
        deleteLocalPost,
      }}
    >
      {loading ? (
        <Container className="text-center my-5">
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
