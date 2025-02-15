import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { WebSocketProvider } from "./contexts/WebSocketContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WebSocketProvider>
      <BrowserRouter basename="/blog_post">
        <App />
      </BrowserRouter>
    </WebSocketProvider>
  </StrictMode>,
);
