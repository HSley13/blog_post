import { Post, Tag } from "../types/types";
import { Row, Col, Container } from "react-bootstrap";
import { PostCard } from "./PostCard";
import { dateFormatter } from "./Comment";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { posts } = useAllPostsContext();

  const myPosts = useMemo(() => {
    return posts?.filter((post: Post) => post.userId === id);
  }, [posts, id]);

  return (
    <Container className="my-4">
      <h1>My Posts</h1>
      <Row xs={1} md={2} xl={2} className="g-3">
        {myPosts?.map((post: Post) => (
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
