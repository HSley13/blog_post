import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AllPostsProvider } from "./contexts/AllPostsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AllPostsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AllPostsProvider>
  </StrictMode>,
);
