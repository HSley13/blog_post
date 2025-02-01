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
  getReplies: () => [],
  rootComments: [],
});

export const usePostContext = () => useContext(Context);

type PostProviderProps = {
  children: React.ReactNode;
};

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const { id } = useParams<{ id: string }>();
  const { loading, error, value: post } = useAsync(() => getPost(id), [id]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (post?.comments == null) return;
    setComments(post.comments);
  }, [post?.comments]);

  const commentsByParentId = useMemo(() => {
    const group = {};

    post?.comments.forEach((comment: Comment) => {
      group[comment.parentId] = group[comment.parentId] || [];
      group[comment.parentId].push(comment);
    });

    return group;
  }, [comments]);

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
