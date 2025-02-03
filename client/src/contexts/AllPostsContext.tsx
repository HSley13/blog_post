import { useParams } from "react-router-dom";
import React, {
  createContext,
  useEffect,
  useState,
  useMemo,
  useContext,
} from "react";
import { useAsync } from "../hooks/useAsync";
import { useWebSocket } from "../hooks/useWebsocket";
import { getPost, getPosts } from "../services/posts";
import { Container } from "react-bootstrap";
import { Comment, Post } from "../types/types";

type AllPostsContextValue = {
  post: Post | undefined;
  loading: boolean;
  posts: Post[] | undefined;
  error: Error | undefined;
  getReplies: (parentId: string | null) => Comment[] | undefined;
  rootComments: Comment[] | undefined;
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

  const { posts: wsPosts } = useWebSocket({
    url: import.meta.env.VITE_WS_URL,
  });

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

  useEffect(() => {
    setPosts((prevPosts) => {
      const newPosts = wsPosts.filter(
        (wsPost) => !prevPosts.some((post) => post.id === wsPost.id),
      );
      return [...prevPosts, ...newPosts];
    });
  }, [wsPosts]);

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
