import { PostList } from "./components/PostLists";
import { Route, Routes, Navigate } from "react-router-dom";
import { Post } from "./components/Post";
import "bootstrap/dist/css/bootstrap.min.css";
import { SinglePostProvider } from "./contexts/SinglePostContext";
import { useAllPostsContext } from "./contexts/AllPostsContext";
import { PostForm } from "./components/PostForm";
import { createPost } from "./services/posts";
import { useAsyncFn } from "./hooks/useAsync";
import { Container } from "react-bootstrap";
import { Tag } from "./types/types";
import { EditPost } from "./components/EditPost";
import { AuthForm } from "./components/AuthForm";
import { AllPostsProvider } from "./contexts/AllPostsContext";
import { MyPostLists } from "./components/MyPostLists";

export const App = () => {
  const { tags, myPosts, createLocalPost } = useAllPostsContext();
  const createPostFunc = useAsyncFn(createPost);
  console.log("App: ", myPosts);

  const onPostSubmit = async (
    title: string,
    body: string,
    userId: string,
    image: File,
    tags?: string[],
  ) => {
    const newPost = await createPostFunc.execute({
      userId: userId,
      title: title,
      body: body,
      file: image,
      tags: tags,
    });
    createLocalPost(newPost);
  };

  return (
    <Container>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route
          path="/posts/myposts"
          element={<MyPostLists myPosts={myPosts} />}
        />
        <Route
          path="/posts"
          element={
            <AllPostsProvider>
              <PostList />
            </AllPostsProvider>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <AllPostsProvider>
              <SinglePostProvider>
                <Post />
              </SinglePostProvider>
            </AllPostsProvider>
          }
        />
        <Route
          path="posts/new"
          element={
            <div className="m-3">
              <AllPostsProvider>
                <PostForm
                  availableTags={tags?.map((tag: Tag) => tag?.name)}
                  onSubmit={onPostSubmit}
                  loading={createPostFunc.loading}
                  error={createPostFunc.error}
                />
              </AllPostsProvider>
            </div>
          }
        />
        <Route
          path="/posts/:id/edit"
          element={
            <AllPostsProvider>
              <SinglePostProvider>
                <EditPost />
              </SinglePostProvider>
            </AllPostsProvider>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Container>
  );
};
