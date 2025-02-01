import { IconButton } from "./IconButton";
import { FaHeart } from "react-icons/fa";

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
  return (
    <>
      <div className="comment">
        <div className="header">
          <span className="name">{user.name}</span>
          <span className="date">
            {dateFormatter.format(Date.parse(createdAt))}
          </span>
        </div>

        <div className="message">{message}</div>

        <div className="footer">
          <IconButton
            aria-lael="Like"
            Icon={FaHeart}
            isActive={likedByMe}
            onClick={() => {}}
          >
            2{" "}
          </IconButton>
        </div>
      </div>
    </>
  );
};
