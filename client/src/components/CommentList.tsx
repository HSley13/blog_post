import { CommentCard } from "./CommentCard";
import { Comment } from "../types/types";

type CommentListProps = {
  comments: Comment[];
};
export const CommentList = ({ comments }: CommentListProps) => {
  const sortedComments = comments.slice().sort((a, b) => {
    const dateA = Date.parse(a.updatedAt || a.createdAt);
    const dateB = Date.parse(b.updatedAt || b.createdAt);
    return dateB - dateA;
  });

  return sortedComments.map((comment) => (
    <div key={comment.id}>
      <CommentCard
        id={comment.id}
        message={comment.message}
        user={comment.user}
        createdAt={comment.createdAt}
        updatedAt={comment.updatedAt}
        likeCount={comment.likeCount}
        likedByMe={comment.likedByMe}
      />
    </div>
  ));
};
