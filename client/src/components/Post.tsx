import { useSinglePostContext } from "../contexts/SinglePostContext";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment } from "../services/comments";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { deletePost, togglePostLike } from "../services/posts";
import { PostDetails } from "./PostDetails";

export const Post = () => {
  const { createLocalComment, post, rootComments } = useSinglePostContext();
  const { deleteLocalPost, toggleLocalPostLike } = useAllPostsContext();
  const currentUser = useUser();
  const navigate = useNavigate();

  const createCommentFunc = useAsyncFn(createComment);
  const deletePostFn = useAsyncFn(deletePost);
  const togglePostLikeFn = useAsyncFn(togglePostLike);

  const handleEditClick = () => navigate(`/posts/${post?.id}/edit`);

  const onDeletePost = async () => {
    await deletePostFn.execute({ id: post?.id.toString() || "" });
    deleteLocalPost(post?.id || "");
    navigate("/");
  };

  const onTogglePostLike = async () => {
    const togglePost = await togglePostLikeFn.execute({
      id: post?.id.toString() || "",
    });
    toggleLocalPostLike(togglePost.id, togglePost.addLike);
  };

  const onCommentSubmit = async (message: string) => {
    const newComment = await createCommentFunc.execute({
      postId: post?.id || "",
      message,
    });
    createLocalComment(newComment);
  };

  return (
    <Container className="my-2">
      {post?.userId === currentUser?.id ? (
        <PostDetails
          post={post}
          onTogglePostLike={onTogglePostLike}
          toggleLocalPostLike={{ loading: togglePostLikeFn.loading }}
          onEdit={handleEditClick}
          onDelete={onDeletePost}
        />
      ) : (
        <PostDetails post={post} onTogglePostLike={onTogglePostLike} />
      )}

      <h3>Comments</h3>
      <section>
        <CommentForm
          onSubmit={onCommentSubmit}
          loading={createCommentFunc.loading}
          error={createCommentFunc.error}
          autoFocus={true}
        />
        {rootComments?.length > 0 && (
          <div className="mt-4">
            <CommentList comments={rootComments} />
          </div>
        )}
      </section>
    </Container>
  );
};
