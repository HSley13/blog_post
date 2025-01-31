import { PostList } from "./components/PostLists";
import { Route, Routes } from "react-router-dom";

export const App = () => {
  return (
    <div className="Container">
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/posts/:id" element={<h1>Post</h1>} />
      </Routes>
    </div>
  );
};
