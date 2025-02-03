import { useParams } from "react-router-dom";
import React, {
  createContext,
  useEffect,
  useState,
  useMemo,
  useContext,
} from "react";
import { useAsync } from "../hooks/useAsync";
import { getPost } from "../services/posts";
import { Container } from "react-bootstrap";
import { Comment, Post } from "../types/types";
import { useWebSocket } from "../hooks/useWebsocket";

type SinglePostContextValue = {
  post: Post | undefined;
  loading: boolean;
  error: Error | undefined;
  getReplies: (parentId: string | null) => Comment[] | undefined;
  rootComments: Comment[] | undefined;
  createLocalComment: (comment: Comment) => void;
  updateLocalComment: (id: string, message: string) => void;
  deleteLocalComment: (id: string) => void;
  toggleLocalCommentLike: (id: string, addLike: boolean) => void;
};

const Context = createContext<SinglePostContextValue>({
  post: undefined,
  loading: false,
  error: undefined,
  getReplies: () => [],
  rootComments: [],
  createLocalComment: () => {},
  updateLocalComment: () => {},
  deleteLocalComment: () => {},
  toggleLocalCommentLike: () => {},
});

export const useSinglePostContext = () => useContext(Context);

type SinglePostProviderProps = {
  children: React.ReactNode;
};

export const SinglePostProvider: React.FC<SinglePostProviderProps> = ({
  children,
}) => {
  const { id } = useParams<{ id: string }>();
  const { loading, error, value: post } = useAsync(() => getPost(id), [id]);
  const [comments, setComments] = useState<Comment[]>([]);

  const { comments: wsComments } = useWebSocket({
    url: import.meta.env.VITE_WS_URL,
  });

  useEffect(() => {
    setComments((prevComments) => {
      const newComments = wsComments.filter(
        (wsComment) =>
          !prevComments.some((comment) => comment.id === wsComment.id),
      );
      return [...prevComments, ...newComments];
    });
  }, [wsComments]);

  useEffect(() => {
    if (post?.comments == null) return;
    setComments(post.comments);
  }, [post?.comments]);

  const commentsByParentId = useMemo(() => {
    const group: { [key: string | null]: Comment[] } = {};

    comments.forEach((comment) => {
      const parentId = comment.parentId || null;
      group[parentId] = group[parentId] || [];
      group[parentId].push(comment);
    });

    return group;
  }, [comments]);

  const getReplies = (parentId: string | null) => {
    return commentsByParentId[parentId];
  };

  const createLocalComment = (comment: Comment) => {
    setComments((prevComments) => [comment, ...prevComments]);
  };

  const updateLocalComment = (id: string, message: string) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === id ? { ...comment, message } : comment,
      ),
    );
  };

  const deleteLocalComment = (id: string) => {
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== id),
    );
  };

  const toggleLocalCommentLike = (id: string, addLike: boolean) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === id
          ? {
              ...comment,
              likeCount: comment.likeCount + (addLike ? 1 : -1),
              likedByMe: addLike,
            }
          : comment,
      ),
    );
  };

  return (
    <Context.Provider
      value={{
        post: post ? { id, ...post } : undefined,
        getReplies,
        rootComments: commentsByParentId[null],
        loading,
        error,
        createLocalComment,
        updateLocalComment,
        deleteLocalComment,
        toggleLocalCommentLike,
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
