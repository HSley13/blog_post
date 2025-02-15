import { IconButton } from "./IconButton";
import {
  FaReply,
  FaHeart,
  FaRegHeart,
  FaEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Card, Row } from "react-bootstrap";
import { useSinglePostContext } from "../contexts/SinglePostContext";
import { CommentList } from "./CommentList";
import { useState } from "react";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { Link } from "react-router-dom";
import { dateFormatter } from "../utils/utils";
import {
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "../services/comments";
import { useUser } from "../hooks/useUser";
import { ConfirmationModal } from "./ConfirmationModal";

type CommentCardProps = {
  id: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
  user: {
    id: string;
    name: string;
  };
};
export const CommentCard = ({
  id,
  message,
  createdAt,
  updatedAt,
  likeCount,
  likedByMe,
  user,
}: CommentCardProps) => {
  const { getReplies, post } = useSinglePostContext();
  const createCommentFunc = useAsyncFn(createComment);
  const updateCommentFunc = useAsyncFn(updateComment);
  const deleteCommentFunc = useAsyncFn(deleteComment);
  const toggleLikeFunc = useAsyncFn(toggleCommentLike);
  const childComments = getReplies(id);
  const [areChildrenHidden, setAreChildrenHidden] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const currentUser = useUser();
  const [showModal, setShowModal] = useState(false);

  const onCommentReply = async (message: string) => {
    await createCommentFunc.execute({
      postId: post?.id || "",
      message,
      parentId: id,
    });
    setIsReplying(false);
  };

  const onCommentUpdate = async (message: string) => {
    await updateCommentFunc.execute({
      postId: post?.id || "",
      id,
      message,
    });
    setIsEditing(false);
  };

  const handleConfirmDeleteComment = async () => {
    await onDeleteComment();
    setShowModal(false);
  };

  const onDeleteComment = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete your comment?",
    );

    if (!confirm) return;

    await deleteCommentFunc.execute({
      postId: post?.id || "",
      id,
    });
  };

  const handleCancelDeleteComment = () => {
    setShowModal(false);
  };

  const onToggleCommentLike = async () => {
    await toggleLikeFunc.execute({
      postId: post?.id || "",
      id,
    });
  };

  return (
    <>
      <ConfirmationModal
        show={showModal}
        onConfirm={handleConfirmDeleteComment}
        onCancel={handleCancelDeleteComment}
        question="Are you sure you want to delete your comment?"
      />

      <Card className="mb-2">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Link to={`/profile/${user?.id}`} className="text-decoration-none">
              <span className="fw-bold">{user.name}</span>
            </Link>
            {createdAt === updatedAt ? (
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                {dateFormatter.format(Date.parse(createdAt))}
              </span>
            ) : (
              <Row className="text-end">
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  created: {dateFormatter.format(Date.parse(createdAt))}
                </span>
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  edited: {dateFormatter.format(Date.parse(updatedAt))}
                </span>
              </Row>
            )}
          </div>

          {isEditing ? (
            <CommentForm
              autoFocus={true}
              initialValue={message}
              loading={updateCommentFunc.loading}
              error={updateCommentFunc.error}
              onSubmit={onCommentUpdate}
            />
          ) : (
            <div className="mb-3">{message}</div>
          )}

          <div className="d-flex gap-1">
            <IconButton
              aria-label={likedByMe ? "Unlike" : "Like"}
              Icon={likedByMe ? FaHeart : FaRegHeart}
              isActive={likedByMe}
              onClick={onToggleCommentLike}
              // disabled={toggleLikeFunc.loading}
              color="blue"
            >
              {likeCount}
            </IconButton>
            <IconButton
              aria-label={isReplying ? "Cancel Reply" : "Reply"}
              Icon={isReplying ? FaTimes : FaReply}
              isActive={isReplying}
              onClick={() => {
                setIsReplying(!isReplying);
              }}
              color="blue"
            />

            {currentUser?.id === user.id && (
              <>
                <IconButton
                  aria-label={isEditing ? "Cancel Edit" : "Edit"}
                  Icon={isEditing ? FaTimes : FaEdit}
                  isActive={isEditing}
                  onClick={() => {
                    setIsEditing(!isEditing);
                  }}
                  color="blue"
                />
                <IconButton
                  Icon={FaTrash}
                  // disabled={deleteCommentFunc.loading}
                  onClick={onDeleteComment}
                  // onClick={() => setShowModal(true)}
                  color="red"
                />
              </>
            )}
          </div>

          {deleteCommentFunc.error && (
            <div className="text-danger mt-2">
              {deleteCommentFunc.error?.message}
            </div>
          )}
        </Card.Body>
      </Card>

      {isReplying && (
        <Card className="mb-2">
          <Card.Body>
            <CommentForm
              autoFocus={true}
              loading={createCommentFunc.loading}
              error={createCommentFunc.error}
              onSubmit={onCommentReply}
              initialValue={`@${user.name}`}
            />
          </Card.Body>
        </Card>
      )}

      {childComments != null && childComments?.length > 0 && (
        <div className="position-relative mb-2">
          <div
            className="position-absolute start-0 top-0 bottom-0"
            style={{ width: "2px", backgroundColor: "#ccc" }}
          />

          <Button
            variant="primary"
            className="rounded-pill mb-2 ms-2"
            onClick={() => setAreChildrenHidden(!areChildrenHidden)}
          >
            {areChildrenHidden ? "Show Replies" : "Hide Replies"}
          </Button>

          {!areChildrenHidden && (
            <div className="ms-4">
              <CommentList comments={childComments} />
            </div>
          )}
        </div>
      )}
    </>
  );
};
