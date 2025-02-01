import { PostList } from "./components/PostLists";
import { Route, Routes } from "react-router-dom";
import { Post } from "./components/Post";
import { PostProvider } from "./contexts/PostContext";
import "bootstrap/dist/css/bootstrap.min.css";

export const App = () => {
  return (
    <div className="Container">
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route
          path="/posts/:id"
          element={
            <PostProvider>
              <Post />
            </PostProvider>
          }
        />
      </Routes>
    </div>
  );
};
