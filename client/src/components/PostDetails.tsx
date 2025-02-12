import { Row, Col, Badge } from "react-bootstrap";
import { FaHeart, FaRegHeart, FaEdit, FaTrash } from "react-icons/fa";
import { IconButton } from "./IconButton";
import { Post, Tag } from "../types/types";
import { dateFormatter } from "./Comment";

type PostDetailsProps = {
  post: Post;
  onTogglePostLike: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const PostDetails = ({
  post,
  onTogglePostLike,
  onEdit,
  onDelete,
}: PostDetailsProps) => {
  return (
    <Row>
      <Col
        xs={12}
        className="d-flex justify-content-between align-items-center"
      >
        <h1>{post?.title}</h1>
        <Col xs="auto" className="d-flex align-items-center gap-2">
          <IconButton
            aria-label={post?.likedByMe ? "Unlike" : "Like"}
            isActive={post?.likedByMe}
            Icon={post?.likedByMe ? FaHeart : FaRegHeart}
            onClick={onTogglePostLike}
            color="blue"
          >
            {post?.likeCount}
          </IconButton>
          {onEdit && (
            <IconButton
              aria-label="Edit"
              Icon={FaEdit}
              color="blue"
              onClick={onEdit}
            />
          )}
          {onDelete && (
            <IconButton
              aria-label="Delete"
              Icon={FaTrash}
              color="red"
              onClick={onDelete}
            />
          )}
        </Col>
      </Col>
      <Col xs={12}>
        {post?.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post"
            style={{ maxWidth: "300px", height: "300px" }}
            className="my-3"
          />
        )}
      </Col>
      <Col xs={12}>
        <p>{post?.body}</p>
      </Col>
      <Col xs={12} className="d-flex flex-wrap mb-3">
        {post?.tags?.map((tag: Tag) => (
          <Badge key={tag.id} bg="primary" className="mx-1">
            {tag.name}
          </Badge>
        ))}
      </Col>
      <Row className="text-end">
        {post?.updatedAt !== post?.createdAt ? (
          <>
            <small className="text-muted ms-1 fs-8">
              created:{" "}
              {dateFormatter.format(
                Date.parse(post?.createdAt || post?.created_at),
              )}
            </small>
            <small className="text-muted ms-1 fs-8">
              last updated:{" "}
              {dateFormatter.format(
                Date.parse(post?.updatedAt || post?.updated_at),
              )}
            </small>
          </>
        ) : (
          <small className="text-muted fs-8">
            {dateFormatter.format(
              Date.parse(post?.createdAt || post?.created_at),
            )}
          </small>
        )}
      </Row>
    </Row>
  );
};
