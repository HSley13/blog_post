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
import { Profile } from "./components/Profile";
import { PasswordRecoveryForm } from "./components/PasswordRecoveryForm";
import { AllPostsProvider } from "./contexts/AllPostsContext";

export const App = () => {
  const { tags } = useAllPostsContext();
  const createPostFunc = useAsyncFn(createPost);

  const onPostSubmit = async (
    title: string,
    body: string,
    userId: string,
    image: File,
    tags?: string[],
  ) => {
    await createPostFunc.execute({
      userId: userId,
      title: title,
      body: body,
      file: image,
      tags: tags,
    });
  };

  return (
    <Container>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/password-recovery" element={<PasswordRecoveryForm />} />

        <Route
          path="/profile/:id"
          element={
            <AllPostsProvider>
              <Profile />
            </AllPostsProvider>
          }
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
          path="/posts/new"
          element={
            <AllPostsProvider>
              <div className="m-3">
                <PostForm
                  availableTags={tags?.map((tag: Tag) => tag?.name)}
                  onSubmit={onPostSubmit}
                  loading={createPostFunc.loading}
                  error={createPostFunc.error}
                  initialTags={[]}
                  title=""
                  body=""
                  imgUrl=""
                />
              </div>
            </AllPostsProvider>
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
