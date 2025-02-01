import { IconButton } from "./IconButton";
import { FaReply, FaHeart, FaEdit, FaTrash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { usePostContext } from "../contexts/PostContext";
import { CommentList } from "./CommentList";

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
  console.log(childComments);
  const areChildrenHidden = false;

  return (
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

      {childComments != null && childComments?.length > 0 && (
        <>
          <div
            className={`nested-comments-stack ${areChildrenHidden ? "hidden" : ""}`}
          >
            <button aria-label="Hide Replies" className="collapse-line" />

            <div className="nested-comments">
              <CommentList comments={childComments} getReplies={getReplies} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
