import { IconButton } from "./IconButton";
import { FaReply, FaHeart, FaEdit, FaTrash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
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
              aria-label="Like"
              Icon={FaHeart}
              isActive={likedByMe}
              onClick={() => {}}
              color="blue"
            >
              {likeCount}
            </IconButton>
            <IconButton
              aria-label="Reply"
              Icon={FaReply}
              isActive={likedByMe}
              onClick={() => {}}
              color="blue"
            />
            <IconButton
              aria-label="Edit"
              Icon={FaEdit}
              isActive={likedByMe}
              onClick={() => {}}
              color="blue"
            />
            <IconButton
              aria-label="Delete"
              Icon={FaTrash}
              isActive={likedByMe}
              onClick={() => {}}
              color="red"
            />
          </div>
        </div>
      </div>

      {childComments != null && childComments?.length > 0 && (
        <>
          <div
            className="nested-comments-stack mb-2"
            style={{ position: "relative", marginLeft: "20px" }}
          >
            <div
              style={{
                position: "absolute",
                left: "-20px",
                top: "0",
                bottom: "0",
                width: "2px",
                backgroundColor: "#ccc",
              }}
            />

            <button
              aria-label="Hide Replies"
              className="mb-2"
              onClick={() => setAreChildrenHidden(!areChildrenHidden)}
              style={{
                background: "#0079d3",
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                padding: "5px 10px",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginLeft: "-10px",
                transition: "background 0.2s ease",
              }}
            >
              {areChildrenHidden ? "Show Replies" : "Hide Replies"}
            </button>

            {!areChildrenHidden && (
              <div className="nested-comments">
                <CommentList comments={childComments} getReplies={getReplies} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};
