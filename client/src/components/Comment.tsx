import { IconButton } from "./IconButton";
import { FaReply, FaHeart, FaEdit, FaTrash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button } from "react-bootstrap";
import { usePostContext } from "../contexts/PostContext";
import { CommentList } from "./CommentList";
import { useState } from "react";

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
  const { getReplies } = usePostContext();
  const childComments = getReplies(id);
  const [areChildrenHidden, setAreChildrenHidden] = useState(true);

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

          <div className="mb-3">{message}</div>

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
              Icon={FaReply}
              isActive={likedByMe}
              onClick={() => {}}
              color="blue"
            />
            <IconButton
              Icon={FaEdit}
              isActive={likedByMe}
              onClick={() => {}}
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
