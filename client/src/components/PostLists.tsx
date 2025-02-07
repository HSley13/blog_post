import { Row, Col, Container } from "react-bootstrap";
import { PostCard } from "./PostCard";
import { dateFormatter } from "./Comment";
import { Post, Tag } from "../types/types";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { createPost } from "../services/posts";
import { useAsyncFn } from "../hooks/useAsync";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import ReactSelect from "react-select";

export const PostList = () => {
  const { loading, error, posts, tags } = useAllPostsContext();
  const createPostFunc = useAsyncFn(createPost);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState<string>("");

  const filteredPosts = useMemo(() => {
    return posts?.filter((post: Post) => {
      const matchesTitle =
        title === "" || post.title.toLowerCase().includes(title.toLowerCase());
      const matchesTags =
        !selectedTags.length ||
        (post.tags &&
          selectedTags.every((tag) =>
            post?.tags?.some((postTag) => postTag.name === tag),
          ));

      return matchesTitle && matchesTags;
    });
  }, [posts, title, selectedTags]);

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
      <Row className="mb-4">
        <Col>
          <Form.Group>
            <Form.Label>Search by title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Search by title"
              className="form-control"
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
        {filteredPosts?.map((post: Post) => (
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
