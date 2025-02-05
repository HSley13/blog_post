import { Link } from "react-router-dom";
import { Card, Badge, Col, Stack } from "react-bootstrap";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import styles from "../modules/PostCard.module.css";
import { IconButton } from "./IconButton";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { togglePostLike } from "../services/posts";
import { useAsyncFn } from "../hooks/useAsync";

type PostCardProps = {
  id: string;
  title: string;
  likeCount: number;
  likedByMe: boolean;
  updatedAt: string;
};
export const PostCard = ({
  id,
  title,
  likeCount,
  likedByMe,
  updatedAt,
}: PostCardProps) => {
  const { toggleLocalPostLike } = useAllPostsContext();
  const togglePostLikeFn = useAsyncFn(togglePostLike);

  const onTogglePostLike = async () => {
    const togglePost = await togglePostLikeFn.execute({
      id: id || "",
    });
    toggleLocalPostLike(togglePost.id, togglePost.addLike);
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
                disabled={togglePostLikeFn.loading}
                Icon={likedByMe ? FaHeart : FaRegHeart}
                onClick={onTogglePostLike}
                color="blue"
              >
                {likeCount}
              </IconButton>
            </Col>
            <div className="ms-auto">
              <small className="text-muted">{updatedAt}</small>
            </div>
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
};
