import { useSinglePostContext } from "../contexts/SinglePostContext";
import { IconButton } from "./IconButton";
import { FaEdit, FaTrash, FaHeart, FaRegHeart } from "react-icons/fa";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment } from "../services/comments";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { deletePost, togglePostLike } from "../services/posts";
import { Tag } from "../types/types";
import { dateFormatter } from "./Comment";

export const Post = () => {
  const { createLocalComment, post, rootComments } = useSinglePostContext();
  const { deleteLocalPost, toggleLocalPostLike } = useAllPostsContext();
  const currentUser = useUser();
  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate(`/posts/${post?.id}/edit`);
  };

  const createCommentFunc = useAsyncFn(createComment);

  const deletePostFn = useAsyncFn(deletePost);
  const togglePostLikeFn = useAsyncFn(togglePostLike);

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
                Icon={FaEdit}
                color="blue"
                onClick={handleEditClick}
              />
              <IconButton Icon={FaTrash} color="red" onClick={onDeletePost} />
            </Col>
          </Col>

          <Col>
            {post?.imageUrl && (
              <img
                src={post?.imageUrl}
                alt="Post Image"
                style={{
                  width: "300px",
                  height: "300px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  margin: "10px auto",
                }}
                className="my-3"
              />
            )}
          </Col>

          <Col xs={12}>
            <p>{post?.body}</p>
          </Col>

          <Col xs={12} className="d-flex flex-wrap mb-3">
            {post?.tags?.map((tag: Tag) => (
              <Badge key={tag.id} bg="primary" className="mx-1">
                {tag.name}
              </Badge>
            ))}
          </Col>

          {dateFormatter.format(Date.parse(post?.updatedAt)) ===
          dateFormatter.format(Date.parse(post?.createdAt)) ? (
            <Row className="text-end">
              <small className="text-muted">
                {dateFormatter.format(Date.parse(post?.createdAt))}
              </small>
            </Row>
          ) : (
            <Row className="text-end">
              <small className="text-muted ms-1 fs-8">
                created: {dateFormatter.format(Date.parse(post?.createdAt))}
              </small>
              <small className="text-muted ms-1 fs-8">
                last updated:
                {dateFormatter.format(Date.parse(post?.updatedAt))}
              </small>
            </Row>
          )}
        </Row>
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
          <Col xs={12} className="d-flex flex-wrap mb-3">
            {post?.tags?.map((tag: Tag) => (
              <Badge key={tag.id} bg="primary" className="mx-1">
                {tag.name}
              </Badge>
            ))}
          </Col>

          {dateFormatter.format(Date.parse(post?.updatedAt)) ===
          dateFormatter.format(Date.parse(post?.createdAt)) ? (
            <Row className="text-end">
              <small className="text-muted">
                {dateFormatter.format(Date.parse(post?.createdAt))}
              </small>
            </Row>
          ) : (
            <Row className="text-end">
              <small className="text-muted ms-1 fs-8">
                created: {dateFormatter.format(Date.parse(post?.createdAt))}
              </small>
              <small className="text-muted ms-1 fs-8">
                last updated:
                {dateFormatter.format(Date.parse(post?.updatedAt))}
              </small>
            </Row>
          )}
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
