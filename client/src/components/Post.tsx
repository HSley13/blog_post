import { usePostContext } from "../contexts/PostContext";
import { CommentList } from "./CommentList";

export const Post = () => {
  const { post, rootComments, getReplies } = usePostContext();
  return (
    <>
      <h1>{post?.title}</h1>
      <p>{post?.body}</p>

      <h3 className="comments-title">Comments</h3>
      <section>
        {rootComments != null && rootComments.length > 0 && (
          <div className="mt-4">
            <CommentList comments={rootComments} getReplies={getReplies} />
          </div>
        )}
      </section>
    </>
  );
};
