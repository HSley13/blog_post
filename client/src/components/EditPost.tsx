import { useParams } from "react-router-dom";
import { useSinglePostContext } from "../contexts/SinglePostContext";
import { PostForm } from "./PostForm";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { useAsyncFn } from "../hooks/useAsync";
import { updatePost } from "../services/posts";

export const EditPost = () => {
  const { id } = useParams();
  const { post } = useSinglePostContext();
  const { updateLocalPost, tags } = useAllPostsContext();
  const updatePostFn = useAsyncFn(updatePost);

  const onPostSubmit = async (
    title: string,
    body: string,
    userId?: string,
    image: File,
    tags?: string[],
  ) => {
    const updatedPost = await updatePostFn.execute({
      id: id,
      title,
      body,
      file: image,
      tags,
    });
    updateLocalPost(
      updatedPost.id,
      updatedPost.title,
      updatedPost.body,
      updatedPost.updatedAt,
      updatedPost.imageUrl || "",
      updatedPost.tags,
    );
  };

  return (
    <PostForm
      title={post?.title}
      body={post?.body}
      imgUrl={post?.imageUrl}
      availableTags={tags?.map((tag) => tag.name)}
      initialTags={post?.tags?.map((tag) => tag.name)}
      onSubmit={onPostSubmit}
      loading={updatePostFn.loading}
      error={updatePostFn.error}
    />
  );
};
