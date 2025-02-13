import React, { createContext, useEffect, useState, useContext } from "react";
import { useAsync } from "../hooks/useAsync";
import { getPosts, getTags } from "../services/posts";
import { Container, Spinner } from "react-bootstrap";
import { Post, Tag, Comment } from "../types/types";
import { useWebSocketContext } from "./WebSocketContext";
import { useUser } from "../hooks/useUser";

type AllPostsContextValue = {
  posts: Post[] | undefined;
  tags: Tag[] | undefined;
  loading: boolean;
  error: Error | undefined;
};

const Context = createContext<AllPostsContextValue>({
  posts: undefined,
  tags: undefined,
  loading: false,
  error: undefined,
});

export const useAllPostsContext = () => useContext(Context);

type AllPostsProviderProps = {
  children: React.ReactNode;
};
export const AllPostsProvider = ({ children }: AllPostsProviderProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const currentUser = useUser();
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
  const { socket, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (socket && isConnected) {
      socket.onmessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "POST_ADDED":
            createLocalPost(message.data);
            break;

          case "POST_UPDATED":
            updateLocalPost(
              message.data.id,
              message.data.title,
              message.data.body,
              message.data.updatedAt,
              message.data.imageUrl,
              message.data.tags,
            );
            break;

          case "POST_DELETED":
            deleteLocalPost(message.data.id);
            break;

          case "POST_LIKED":
            toggleLocalPostLike(
              message.data.id,
              message.data.addLike,
              message.data.userId,
            );
            break;

          case "COMMENT_ADDED":
            addCommentToPost(message.data.postId, message.data.comment);
            break;

          case "COMMENT_UPDATED":
            updateCommentInPost(
              message.data.postId,
              message.data.commentId,
              message.data.message,
              message.data.updatedAt,
            );
            break;

          case "COMMENT_DELETED":
            deleteCommentFromPost(message.data.postId, message.data.commentId);
            break;

          case "COMMENT_LIKED":
            toggleLocalCommentLike(
              message.data.postId,
              message.data.commentId,
              message.data.addLike,
              message.data.userId,
            );
            break;

          default:
            console.warn("Unknown message type:", message.type);
        }
      };
    }
  }, [socket, isConnected]);

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

  const toggleLocalPostLike = (
    id: string,
    addLike: boolean,
    userId: string,
  ) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              likeCount: post.likeCount + (addLike ? 1 : -1),
              likedByMe: addLike && userId === currentUser?.id,
            }
          : post,
      ),
    );
  };

  const addCommentToPost = (postId: string, comment: Comment) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [comment, ...(post.comments || [])],
            }
          : post,
      ),
    );
  };

  const updateCommentInPost = (
    postId: string,
    commentId: string,
    message: string,
    updatedAt: string,
  ) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments?.map((comment) =>
                comment.id === commentId
                  ? { ...comment, message, updatedAt }
                  : comment,
              ),
            }
          : post,
      ),
    );
  };

  const deleteCommentFromPost = (postId: string, commentId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments?.filter(
                (comment) => comment.id !== commentId,
              ),
            }
          : post,
      ),
    );
  };

  const toggleLocalCommentLike = (
    postId: string,
    commentId: string,
    addLike: boolean,
    userId: string,
  ) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments?.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      likeCount: comment.likeCount + (addLike ? 1 : -1),
                      likedByMe: addLike && userId === currentUser?.id,
                    }
                  : comment,
              ),
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
