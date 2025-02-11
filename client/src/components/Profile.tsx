import React, { useMemo } from "react";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useUser } from "../hooks/useUser";
import { useParams } from "react-router-dom";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { Post, Tag } from "../types/types";
import { PostCard } from "./PostCard";
import { dateFormatter } from "./Comment";
import { useAsync, useAsyncFn } from "../hooks/useAsync";
import {
  getUserInfo,
  updateUserInfo,
  updatePassword,
  deleteUser,
} from "../services/auth";
import { UserInfoCard } from "./UserInfoCard";

export const Profile = () => {
  const currentUser = useUser();
  const { id } = useParams<{ id: string }>();
  const isOwner = currentUser?.id === id;
  const { posts } = useAllPostsContext();
  const deleteUserFn = useAsyncFn(deleteUser);
  const updateUserInfoFn = useAsyncFn(updateUserInfo);
  const updatePasswordFn = useAsyncFn(updatePassword);

  const userInfoFn = useAsync(() => {
    return getUserInfo({ id: id });
  }, [id]);

  const myPosts = useMemo(() => {
    return posts?.filter((post: Post) => post.userId === id);
  }, [posts, id]);

  const handleDeleteUser = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete your profile?",
    );

    if (!confirm) return;

    const response = await deleteUserFn.execute();
    if (response.message) {
      alert(response.message || "Delete failed");
    } else {
      alert("Delete successful");
    }

    navigate("/");
  };

  const handleUpdateUserInfo = async (userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    file?: File;
  }) => {
    const updateUserResponse = await updateUserInfoFn.execute({
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      file: userInfo.image || undefined,
    });

    if (updateUserResponse.message) {
      alert(updateUserResponse.message || "Update failed");
    } else {
      alert("Update successful");
    }
  };

  const handleUpdatePassword = async (passwords: { newPassword: string }) => {
    const updatePasswordResponse = await updatePasswordFn.execute({
      newPassword: passwords.newPassword,
    });

    if (updatePasswordResponse.message) {
      alert(updatePasswordResponse.message || "Update failed");
    } else {
      alert("Update successful");
    }
  };

  if (userInfoFn.loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading user information...</p>
      </Container>
    );
  }

  if (userInfoFn.error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>
            {userInfoFn.error.message || "Failed to load user information."}
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      {userInfoFn.value && (
        <UserInfoCard
          user={userInfoFn.value}
          isOwner={isOwner}
          onDeleteUser={handleDeleteUser}
          onUpdateUserInfo={handleUpdateUserInfo}
          onUpdatePassword={handleUpdatePassword}
        />
      )}

      <Container className="my-4 text-center">
        <h1>Posts</h1>
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
      </Container>
    </>
  );
};
