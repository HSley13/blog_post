import { Row, Col, Container } from "react-bootstrap";
import { PostCard } from "./PostCard";
import { dateFormatter } from "./Comment";
import { Post, Tag } from "../types/types";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { createPost } from "../services/posts";
import { PostForm } from "./PostForm";
import { useAsyncFn } from "../hooks/useAsync";

export const PostList = () => {
  const { loading, error, posts, createLocalPost } = useAllPostsContext();
  const createPostFunc = useAsyncFn(createPost);

  const onPostSubmit = async (
    title: string,
    body: string,
    userId: string,
    image: File,
    tags?: string[],
  ) => {
    console.log("PostList: ", image);
    const newPost = await createPostFunc.execute({
      userId: userId,
      title: title,
      body: body,
      file: image,
      tags: tags,
    });
    createLocalPost(newPost);
    console.log("PostList: imageUrl", newPost.imageUrl);
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <h1>Loading...</h1>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center my-5">
        <h1 className="error-msg">{createPostFunc.error?.message}</h1>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Col className="mb-4">
        <h1 className="text-center mb-4">Create Post</h1>
        <PostForm
          onSubmit={onPostSubmit}
          loading={createPostFunc.loading}
          error={createPostFunc.error}
        />
      </Col>
      <h1 className="text-center mb-4">Most Recent Posts</h1>
      <Row xs={1} md={2} xl={3} className="g-3">
        {posts?.map((post: Post) => (
          <Col key={post.id}>
            <PostCard
              id={post.id.toString()}
              title={post.title}
              likeCount={post.likeCount}
              likedByMe={post.likedByMe}
              tags={post?.tags?.map((tag: Tag) => tag?.name)}
              updatedAt={dateFormatter.format(
                Date.parse(post.updated_at || post.updatedAt),
              )}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
};
