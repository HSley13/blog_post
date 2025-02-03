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
  createLocalPost: (post: Post) => void;
  updateLocalPost: (id: string, title: string, body: string) => void;
  deleteLocalPost: (id: string) => void;
  createLocalComment: (comment: Comment) => void;
  updateLocalComment: (id: string, message: string) => void;
  deleteLocalComment: (id: string) => void;
  toggleLocalCommentLike: (id: string, addLike: boolean) => void;
};

const Context = createContext<PostContextValue>({
  post: undefined,
  loading: false,
  error: undefined,
  getReplies: () => [],
  rootComments: [],
  createLocalPost: () => {},
  updateLocalPost: () => {},
  deleteLocalPost: () => {},
  createLocalComment: () => {},
  updateLocalComment: () => {},
  deleteLocalComment: () => {},
  toggleLocalCommentLike: () => {},
});

export const usePostContext = () => useContext(Context);

type PostProviderProps = {
  children: React.ReactNode;
};

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const { id } = useParams<{ id: string }>();
  const { loading, error, value: post } = useAsync(() => getPost(id), [id]);
  const [comments, setComments] = useState<Comment[]>([]);

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

  const createLocalPost = (Post: Post) => {};
  const updateLocalPost = (id: string, title: string, body: string) => {};
  const deleteLocalPost = (id: string) => {};

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
