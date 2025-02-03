import { useEffect, useState } from "react";
import { Comment, Post } from "../types/types";

type Message =
  | { type: "NEW_POST"; data: Post }
  | { type: "NEW_COMMENT"; data: Comment };

type WebSocketProps = {
  url: string;
};
export const useWebSocket = ({ url }: WebSocketProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      if (message.type === "NEW_POST") {
        setPosts((prevPosts) => [message.data, ...prevPosts]);
      } else if (message.type === "NEW_COMMENT") {
        setComments((prevComments) => [message.data, ...prevComments]);
      }
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { posts, comments };
};
