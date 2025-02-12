import { Comment } from "./Comment";

type Comment = {
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

type CommentListProps = {
  comments: Comment[];
};
export const CommentList = ({ comments }: CommentListProps) => {
  return comments.map((comment) => (
    <div key={comment.id}>
      <Comment
        id={comment.id}
        message={comment.message}
        user={comment.user}
        createdAt={comment.createdAt}
        likeCount={comment.likeCount}
        likedByMe={comment.likedByMe}
      />
    </div>
  ));
};
