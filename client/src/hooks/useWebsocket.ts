import { useEffect, useState } from "react";
import { Comment, Post } from "../types/types";
import WebSocket from "isomorphic-ws";

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

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event: MessageEvent) => {
      const message: Message = JSON.parse(event.data);
      if (message.type === "NEW_POST") {
        console.log("New Post received");
        setPosts((prevPosts) => [message.data, ...prevPosts]);
      } else if (message.type === "NEW_COMMENT") {
        console.log("New Comment received");
        setComments((prevComments) => [message.data, ...prevComments]);
      }
    };

    ws.onerror = (error: Error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { posts, comments };
};
