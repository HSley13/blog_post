import { useSinglePostContext } from "../contexts/SinglePostContext";
import { IconButton } from "./IconButton";
import { FaEdit, FaTrash, FaHeart, FaRegHeart } from "react-icons/fa";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment } from "../services/comments";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { PostForm } from "./PostForm";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { useState } from "react";
import { updatePost, deletePost, togglePostLike } from "../services/posts";

export const Post = () => {
  const { createLocalComment, post, rootComments } = useSinglePostContext();
  const { updateLocalPost, deleteLocalPost, toggleLocalPostLike } =
    useAllPostsContext();
  const [isEditing, setIsEditing] = useState(false);
  const currentUser = useUser();
  const navigate = useNavigate();

  const createCommentFunc = useAsyncFn(createComment);

  const updatePostFn = useAsyncFn(updatePost);
  const deletePostFn = useAsyncFn(deletePost);
  const togglePostLikeFn = useAsyncFn(togglePostLike);

  const onPostSubmit = async (title: string, body: string, image: File) => {
    if (!image) {
      console.log("image is undefined");
    }
    const updatedPost = await updatePostFn.execute({
      id: post?.id.toString() || "",
      title: title,
      body: body,
      file: image,
    });
    setIsEditing(false);
    updateLocalPost(
      updatedPost.id,
      updatedPost.title,
      updatedPost.body,
      updatedPost.imageUrl || "",
      updatedPost.updatedAt,
    );
    console.log("imageUrl", updatedPost.imageUrl);
  };

  const onDeletePost = async () => {
    await deletePostFn.execute({
      id: post?.id.toString() || "",
    });
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
        isEditing ? (
          <Row>
            <Col xs={12}>
              <PostForm
                title={post?.title}
                body={post?.body}
                imgUrl={post?.imageUrl}
                onSubmit={onPostSubmit}
                loading={updatePostFn.loading}
                error={updatePostFn.error}
              />
            </Col>
          </Row>
        ) : (
          <Row>
            <Col xs={12} className="d-flex justify-content-between">
              <h1>{post?.title}</h1>
              <Col xs="auto">
                <IconButton
                  aria-label={post?.likedByMe ? "Unlike" : "Like"}
                  isActive={post?.likedByMe}
                  disabled={togglePostLikeFn.loading}
                  Icon={post?.likedByMe ? FaHeart : FaRegHeart}
                  onClick={onTogglePostLike}
                  color="blue"
                >
                  {post?.likeCount}
                </IconButton>
                <IconButton
                  aria-label={isEditing ? "Cancel Edit" : "Edit"}
                  Icon={FaEdit}
                  color="blue"
                  onClick={() => setIsEditing(true)}
                />
                {!isEditing && (
                  <IconButton
                    Icon={FaTrash}
                    color="red"
                    onClick={onDeletePost}
                  />
                )}
              </Col>
            </Col>

            <Col>
              {post?.imageUrl && (
                <img
                  src={post?.imageUrl}
                  alt="Post Image"
                  style={{ maxWidth: "100%", height: "auto" }}
                  className="my-3"
                />
              )}
            </Col>

            <Col xs={12}>
              <p>{post?.body}</p>
            </Col>
          </Row>
        )
      ) : (
        <>
          <Row>
            <Col xs={12} className="d-flex justify-content-between">
              <h1>{post?.title}</h1>
              <IconButton
                aria-label={post?.likedByMe ? "Unlike" : "Like"}
                isActive={post?.likedByMe}
                disabled={togglePostLikeFn.loading}
                Icon={post?.likedByMe ? FaHeart : FaRegHeart}
                onClick={onTogglePostLike}
                color="blue"
              >
                {post?.likeCount}
              </IconButton>
            </Col>
            <Col>
              {post?.imageUrl && (
                <img
                  src={post?.imageUrl}
                  alt="Post Image"
                  style={{ maxWidth: "50%", height: "auto" }}
                  className="my-3"
                />
              )}
            </Col>
          </Row>

          <p>{post?.body}</p>
        </>
      )}

      <h3>Comments</h3>

      <section>
        <CommentForm
          onSubmit={onCommentSubmit}
          loading={createCommentFunc.loading}
          error={createCommentFunc.error}
          autoFocus={true}
        />
        {rootComments && rootComments.length > 0 && (
          <div className="mt-4">
            <CommentList comments={rootComments} />
          </div>
        )}
      </section>
    </Container>
  );
};
