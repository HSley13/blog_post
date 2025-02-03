import { usePostContext } from "../contexts/PostContext";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment } from "../services/comments";
import { Container } from "react-bootstrap";

export const Post = () => {
  const { createLocalComment, post, rootComments } = usePostContext();

  const {
    loading,
    error,
    execute: createCommentFunc,
  } = useAsyncFn(createComment);

  const onCommentSubmit = async (message: string) => {
    const newComment = await createCommentFunc({
      postId: post?.id || "",
      message,
    });
    createLocalComment(newComment);
  };

  return (
    <Container className="my-2">
      <h1>{post?.title}</h1>
      <p>{post?.body}</p>
      <h3>Comments</h3>

      <section>
        <CommentForm
          onSubmit={onCommentSubmit}
          loading={loading}
          error={error}
          autoFocus={true}
        />
        {rootComments != null && rootComments.length > 0 && (
          <div className="mt-4">
            <CommentList comments={rootComments} />
          </div>
        )}
      </section>
    </Container>
  );
};
