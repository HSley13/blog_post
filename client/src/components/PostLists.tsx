import { Row, Col, Container } from "react-bootstrap";
import { PostCard } from "./PostCard";
import { dateFormatter } from "./Comment";
import { Post, Tag } from "../types/types";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { createPost } from "../services/posts";
import { useAsyncFn } from "../hooks/useAsync";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export const PostList = () => {
  const { loading, error, posts } = useAllPostsContext();
  const createPostFunc = useAsyncFn(createPost);

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
      <Col className="mb-4 d-flex justify-content-end">
        <Link to="/posts/new">
          <Button variant="primary">Create Post</Button>
        </Link>
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
              createdAt={dateFormatter.format(
                Date.parse(post.createdAt || post.created_at),
              )}
              updatedAt={dateFormatter.format(
                Date.parse(post.updatedAt || post.updated_at),
              )}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
};
