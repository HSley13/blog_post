import { Comment } from "./Comment";

type Comment = {
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

type CommentListProps = {
  comments: Comment[];
  getReplies: (parentId: string | null) => Comment[] | undefined;
};

export const CommentList = ({ comments, getReplies }: CommentListProps) => {
  return comments.map((comment) => (
    <div key={comment.id} className="comment-stack">
      <Comment
        message={comment.message}
        user={comment.user}
        createdAt={comment.createdAt}
        likeCount={comment.likeCount}
        likedByMe={comment.likedByMe}
        parentId={comment.parentId}
      />
    </div>
  ));
};
