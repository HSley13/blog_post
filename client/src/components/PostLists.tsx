import { Row, Col, Container } from "react-bootstrap";
import { PostCard } from "./PostCard";
import { dateFormatter } from "../utils/utils";
import { Post, Tag } from "../types/types";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import ReactSelect from "react-select";
import { FaUser } from "react-icons/fa";
import { useUser } from "../hooks/useUser";

export const PostList = () => {
  const { posts, tags } = useAllPostsContext();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState<string>("");
  const currentUser = useUser();

  const filteredPosts = useMemo(() => {
    return posts
      ?.filter((post: Post) => {
        const matchesTitle =
          title === "" ||
          post.title.toLowerCase().includes(title.toLowerCase());
        const matchesTags =
          !selectedTags.length ||
          (post.tags &&
            selectedTags.every((tag) =>
              post?.tags?.some((postTag) => postTag.name === tag),
            ));

        return matchesTitle && matchesTags;
      })
      .sort((a: Post, b: Post) => {
        const dateA = Date.parse(a.updatedAt || a.createdAt);
        const dateB = Date.parse(b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
  }, [posts, title, selectedTags]);

  return (
    <Container className="my-4">
      <Col className="mb-4 gap-2 d-flex justify-content-end">
        <Link to="/posts/new">
          <Button variant="primary">New Post</Button>
        </Link>
        <Link to={`/profile/${currentUser?.id}`}>
          <Button variant="primary" className="d-flex align-items-center">
            <FaUser style={{ marginRight: "8px" }} />
            Profile
          </Button>
        </Link>
      </Col>
      <Row className="mb-4">
        <Col>
          <Form.Group>
            <Form.Label>Search by title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title..."
            />
          </Form.Group>
        </Col>
        <Col xs="auto">
          <Form.Group>
            <Form.Label>Search by tags</Form.Label>
            <ReactSelect
              isMulti
              options={tags?.map((tag) => ({
                value: tag?.name,
                label: tag?.name,
              }))}
              value={selectedTags.map((tag) => ({
                value: tag,
                label: tag,
              }))}
              onChange={(selectedOptions) => {
                setSelectedTags(
                  selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : [],
                );
              }}
            />
          </Form.Group>
        </Col>
      </Row>
      <h1 className="text-center mb-4">Most Recent Posts</h1>
      <Row xs={1} md={2} xl={2} className="g-3">
        {filteredPosts && filteredPosts.length > 0 ? (
          filteredPosts.map((post: Post) => {
            if (!post.id) {
              return null;
            }
            return (
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
            );
          })
        ) : (
          <p>No posts found.</p>
        )}
      </Row>
    </Container>
  );
};
