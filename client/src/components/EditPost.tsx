import { useParams } from "react-router-dom";
import { useSinglePostContext } from "../contexts/SinglePostContext";
import { PostForm } from "./PostForm";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { useAsyncFn } from "../hooks/useAsync";
import { updatePost } from "../services/posts";
import { Container, Spinner, Alert } from "react-bootstrap";

export const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const { loading, error, post } = useSinglePostContext();
  const { tags } = useAllPostsContext();
  const updatePostFn = useAsyncFn(updatePost);

  const onPostSubmit = async (
    title: string,
    body: string,
    userId?: string,
    image?: File,
    tags?: string[],
  ) => {
    console.log(userId);
    await updatePostFn.execute({
      id: id?.toString(),
      title,
      body,
      file: image,
      tags,
    });
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading user information...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error?.message || "Failed to load user information."}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <PostForm
      title={post?.title}
      body={post?.body}
      imgUrl={post?.imageUrl}
      availableTags={tags?.map((tag) => tag.name)}
      initialTags={post?.tags?.map((tag) => tag.name)}
      onSubmit={onPostSubmit}
      loading={updatePostFn.loading}
      error={updatePostFn.error}
    />
  );
};
