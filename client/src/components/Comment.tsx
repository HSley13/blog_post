import { IconButton } from "./IconButton";
import { FaReply, FaHeart, FaEdit, FaTrash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button } from "react-bootstrap";
import { usePostContext } from "../contexts/PostContext";
import { CommentList } from "./CommentList";
import { useState } from "react";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment, updateComment } from "../services/comments";

type CommentProps = {
  id: string;
  message: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  parentId: string | null;
  user: {
    id: string;
    name: string;
  };
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const Comment = ({
  id,
  message,
  createdAt,
  likeCount,
  likedByMe,
  parentId,
  user,
}: CommentProps) => {
  const {
    createLocalComment,
    updateLocalComment,
    deleteLocalComment,
    getReplies,
    toggleLocalCommentLike,
    rootComments,
    post,
  } = usePostContext();
  const createCommentFunc = useAsyncFn(createComment);
  const updateCommentFunc = useAsyncFn(updateComment);
  const childComments = getReplies(id);
  const [areChildrenHidden, setAreChildrenHidden] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  return (
    <>
      <div className="card mb-2">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold">{user.name}</span>
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
              Icon={FaHeart}
              isActive={likedByMe}
              onClick={() => {}}
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
              isActive={likedByMe}
              onClick={() => {}}
              variant="danger"
              color="red"
            />
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="card mb-2">
          <div className="card-body">
            <CommentForm
              autoFocus={true}
              loading={createCommentFunc.loading}
              error={createCommentFunc.error}
              onSubmit={onCommentReply}
              initialValue={`@${user.name}`}
            />
          </div>
        </div>
      )}

      {childComments != null && childComments?.length > 0 && (
        <>
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
                <CommentList comments={childComments} getReplies={getReplies} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};
