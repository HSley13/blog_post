import { Post, Tag } from "../types/types";
import { Row, Col } from "react-bootstrap";
import { PostCard } from "./PostCard";
import { dateFormatter } from "./Comment";

type MyPostListProps = {
  myPosts: Post[] | undefined;
};
export const MyPostLists = ({ myPosts }: MyPostListProps) => {
  console.log(myPosts);
  return (
    <div>
      <h1>My Posts</h1>
      <Row xs={1} md={2} xl={2} className="g-3">
        {myPosts?.map((post: Post) => (
          <Col key={post.id}>
            <PostCard
              id={post.id.toString()}
              title={post.title}
              likeCount={post.likeCount}
              likedByMe={post.likedByMe}
              tags={post?.tags?.map((tag: Tag) => tag?.name)}
              createdAt={dateFormatter.format(
                Date.parse(post.createdAt || post.created_at),
              )}
              updatedAt={dateFormatter.format(
                Date.parse(post.updatedAt || post.updated_at),
              )}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};
