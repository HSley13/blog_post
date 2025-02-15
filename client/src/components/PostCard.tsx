import { Link } from "react-router-dom";
import { Card, Badge, Col, Stack, Row } from "react-bootstrap";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import styles from "../modules/PostCard.module.css";
import { IconButton } from "./IconButton";
import { togglePostLike } from "../services/posts";
import { useAsyncFn } from "../hooks/useAsync";

type PostCardProps = {
  id: string;
  title: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
};

export const PostCard = ({
  id,
  title,
  likeCount,
  likedByMe,
  createdAt,
  updatedAt,
  tags,
}: PostCardProps) => {
  const togglePostLikeFn = useAsyncFn(togglePostLike);

  const onTogglePostLike = async () => {
    await togglePostLikeFn.execute({
      id: id || "",
    });
  };

  return (
    <Card
      as={Link}
      to={`/posts/${id}`}
      className={`h-100 text-reset text-decoration-none ${styles.card}`}
    >
      <Card.Body>
        <Stack gap={2}>
          <Stack direction="vertical" gap={3}>
            <Col className="d-flex justify-content-between align-items-center">
              <Badge bg="primary" className="fs-6">
                {title}
              </Badge>
              <IconButton
                aria-label={likedByMe ? "Unlike" : "Like"}
                isActive={likedByMe}
                // disabled={togglePostLikeFn.loading}
                Icon={likedByMe ? FaHeart : FaRegHeart}
                onClick={onTogglePostLike}
                color="blue"
              >
                {likeCount}
              </IconButton>
            </Col>
            <Col className="d-flex justify-content-between align-items-center">
              <Col className="d-flex mt-2">
                {tags?.map((tag) => (
                  <Badge className="me-1" bg="secondary" key={tag}>
                    {tag}
                  </Badge>
                ))}
              </Col>
              {updatedAt === createdAt ? (
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {createdAt}
                </span>
              ) : (
                <Row className="text-end">
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                    created: {createdAt}
                  </span>
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                    edited: {updatedAt}
                  </span>
                </Row>
              )}
            </Col>
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
};
