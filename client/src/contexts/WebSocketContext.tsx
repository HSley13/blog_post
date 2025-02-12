import React, { createContext, useEffect, useState, useContext } from "react";
import WebSocket from "isomorphic-ws";

type WebSocketContextValue = {
  socket: WebSocket | null;
  isConnected: boolean;
};

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  isConnected: false,
});

export const useWebSocketContext = () => useContext(WebSocketContext);

type WebSocketProviderProps = {
  url?: string;
  children?: React.ReactNode;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketUrl = import.meta.env.VITE_SOCKET_URL;

  useEffect(() => {
    const ws = new WebSocket(socketUrl);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [socketUrl]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
