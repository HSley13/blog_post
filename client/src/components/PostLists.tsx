import { Row, Col, Container } from "react-bootstrap";
import { CommentCard } from "./CommentCard";
import { dateFormatter } from "./Comment";
import { Post } from "../types/types";
import { useAllPostsContext } from "../contexts/AllPostsContext";

export const PostList = () => {
  const { loading, error, posts } = useAllPostsContext();

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
        <h1 className="error-msg">{error?.message}</h1>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">Most Recent Posts</h1>
      <Row xs={1} md={2} xl={3} className="g-3">
        {posts?.map((post: Post) => (
          <Col key={post.id}>
            <CommentCard
              id={post.id.toString()}
              title={post.title}
              updatedAt={dateFormatter.format(Date.parse(post.updated_at))}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
};
