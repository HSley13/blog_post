import { PostList } from "./components/PostLists";
import { Route, Routes } from "react-router-dom";
import { Post } from "./components/Post";
import "bootstrap/dist/css/bootstrap.min.css";
import { AllPostsProvider } from "./contexts/AllPostsContext";
import { SinglePostProvider } from "./contexts/SinglePostContext";

export const App = () => {
  return (
    <div className="Container">
      <Routes>
        <Route
          path="/"
          element={
            <AllPostsProvider>
              <PostList />
            </AllPostsProvider>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <SinglePostProvider>
              <Post />
            </SinglePostProvider>
          }
        />
      </Routes>
    </div>
  );
};
