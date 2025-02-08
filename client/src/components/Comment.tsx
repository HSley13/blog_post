import { IconButton } from "./IconButton";
import { FaReply, FaHeart, FaRegHeart, FaEdit, FaTrash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Card } from "react-bootstrap";
import { useSinglePostContext } from "../contexts/SinglePostContext";
import { CommentList } from "./CommentList";
import { useState } from "react";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { Link } from "react-router-dom";
import {
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "../services/comments";
import { useUser } from "../hooks/useUser";

type CommentProps = {
  id: string;
  message: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  user: {
    id: string;
    name: string;
  };
};

export const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const Comment = ({
  id,
  message,
  createdAt,
  likeCount,
  likedByMe,
  user,
}: CommentProps) => {
  const {
    createLocalComment,
    updateLocalComment,
    deleteLocalComment,
    getReplies,
    toggleLocalCommentLike,
    post,
  } = useSinglePostContext();
  const createCommentFunc = useAsyncFn(createComment);
  const updateCommentFunc = useAsyncFn(updateComment);
  const deleteCommentFunc = useAsyncFn(deleteComment);
  const toggleLikeFunc = useAsyncFn(toggleCommentLike);
  const childComments = getReplies(id);
  const [areChildrenHidden, setAreChildrenHidden] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const currentUser = useUser();

  const onCommentReply = async (message: string) => {
    const newComment = await createCommentFunc.execute({
      postId: post?.id || "",
      message,
      parentId: id,
    });
    setIsReplying(false);
    createLocalComment(newComment);
  };

  const onCommentUpdate = async (message: string) => {
    const updatedComment = await updateCommentFunc.execute({
      postId: post?.id || "",
      id,
      message,
    });
    setIsEditing(false);
    updateLocalComment(updatedComment.id, updatedComment.message);
  };

  const onCommentDelete = async () => {
    const deletedComment = await deleteCommentFunc.execute({
      postId: post?.id || "",
      id,
    });
    deleteLocalComment(deletedComment.id);
  };

  const onToggleCommentLike = async () => {
    const toggleComment = await toggleLikeFunc.execute({
      postId: post?.id || "",
      id,
    });
    toggleLocalCommentLike(toggleComment.id, toggleComment.addLike);
  };

  return (
    <>
      <Card className="mb-2">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Link to={`/profile/${user?.id}`} className="text-decoration-none">
              <span className="fw-bold">{user.name}</span>
            </Link>
            <span className="text-muted">
              {dateFormatter.format(Date.parse(createdAt))}
            </span>
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
              disabled={toggleLikeFunc.loading}
              color="blue"
            >
              {likeCount}
            </IconButton>
            <IconButton
              aria-label={isReplying ? "Cancel Reply" : "Reply"}
              Icon={FaReply}
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
                  Icon={FaEdit}
                  isActive={isEditing}
                  onClick={() => {
                    setIsEditing(!isEditing);
                  }}
                  color="blue"
                />
                <IconButton
                  Icon={FaTrash}
                  disabled={deleteCommentFunc.loading}
                  onClick={onCommentDelete}
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
