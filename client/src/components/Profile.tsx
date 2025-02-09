import { useState, useMemo, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  Spinner,
  Alert,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useUser } from "../hooks/useUser";
import { useParams } from "react-router-dom";
import { useAllPostsContext } from "../contexts/AllPostsContext";
import { Post, Tag } from "../types/types";
import { PostCard } from "./PostCard";
import { dateFormatter } from "./Comment";
import { useAsyncFn, useAsync } from "../hooks/useAsync";
import { getUserInfo, updateUserInfo, updatePassword } from "../services/auth";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const Profile = () => {
  const currentUser = useUser();
  const { id } = useParams<{ id: string }>();
  const isOwner = currentUser?.id === id;
  const { posts } = useAllPostsContext();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const {
    loading: userInfoLoading,
    error: userInfoError,
    value: userInfo,
  } = useAsync(() => {
    if (id) {
      return getUserInfo({ id: id });
    }
  }, [id]);

  const updateUserInfoFn = useAsyncFn(updateUserInfo);
  const updatePasswordFn = useAsyncFn(updatePassword);

  const myPosts = useMemo(() => {
    return posts?.filter((post: Post) => post.userId === id);
  }, [posts, id]);

  const validateFields = (fields: Record<string, string>) => {
    const newErrors: Record<string, boolean> = {};
    Object.keys(fields).forEach((key) => {
      newErrors[key] = !fields[key];
    });

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const [user, setUser] = useState<User>({
    firstName: "",
    lastName: "",
    email: "",
    imageUrl: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (userInfo) {
      setUser({
        firstName: userInfo.firstName || "",
        lastName: userInfo.lastName || "",
        email: userInfo.email || "",
        imageUrl: userInfo.imageUrl || "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [userInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (image) {
      const newImageUrl = URL.createObjectURL(image);
      setUser((prevUser) => ({
        ...prevUser,
        imageUrl: newImageUrl,
      }));
    }

    const updateUserResponse = await updateUserInfoFn.execute({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      file: image || undefined,
    });

    if (updateUserResponse.message) {
      alert(updateUserResponse.message || "Update failed");
    } else {
      alert("Update successful");
    }

    setIsEditing(false);
    setImage(null);
    setImagePreview(null);
  };

  const handleChangePassword = async () => {
    if (
      !validateFields({
        oldPassword: user.oldPassword,
        newPassword: user.newPassword,
        confirmPassword: user.confirmPassword,
      })
    ) {
      return;
    }

    if (user.newPassword !== user.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const updatePasswordResponse = await updatePasswordFn.execute({
      oldPassword: user.oldPassword,
      newPassword: user.newPassword,
      confirmPassword: user.confirmPassword,
    });

    if (updatePasswordResponse.message) {
      alert(updatePasswordResponse.message || "Update failed");
    } else {
      alert("Update successful");
    }

    setIsChangingPassword(false);
    setUser((prevUser) => ({
      ...prevUser,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleDeleteProfile = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete your profile?",
    );
    if (confirm) {
      // await updateUserInfoFn.execute({
      //   firstName: "",
      //   lastName: "",
      //   email: "",
      //   file: null,
      // });
      alert("Profile deleted successfully");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setImage(null);
    setImagePreview(null);
    if (userInfo) {
      setUser({
        firstName: userInfo.firstName || "",
        lastName: userInfo.lastName || "",
        email: userInfo.email || "",
        imageUrl: userInfo.imageUrl || "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setUser((prevUser) => ({
      ...prevUser,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  if (userInfoLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading user information...</p>
      </Container>
    );
  }

  if (userInfoError) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{userInfoError.message || "Failed to load user information."}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container className="mt-5 p-4 shadow-sm border rounded">
        <Row>
          <Col md={6} className="border-end pe-4">
            <h3>Profile Picture</h3>
            <Image
              src={imagePreview || user.imageUrl}
              roundedCircle
              fluid
              className="mb-3"
              style={{ width: "150px", height: "150px" }}
            />
            {isEditing && (
              <Form.Group className="mb-3">
                <Form.Label>Upload New Profile Picture</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Form.Group>
            )}
            {isOwner && (
              <Col className="mt-2 mb-2">
                <Button
                  variant="primary"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  Change Password
                </Button>
              </Col>
            )}
            {isChangingPassword && (
              <Form className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label>Old Password</Form.Label>
                  <Form.Control
                    className={`my-3 ${errors.oldPassword ? "invalid" : ""}`}
                    type="password"
                    name="oldPassword"
                    value={user.oldPassword}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    className={`my-3 ${errors.newPassword ? "invalid" : ""}`}
                    type="password"
                    name="newPassword"
                    value={user.newPassword}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    className={`my-3 ${errors.confirmPassword ? "invalid" : ""}`}
                    type="password"
                    name="confirmPassword"
                    value={user.confirmPassword}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Col className="mb-2">
                  <Button variant="success" onClick={handleChangePassword}>
                    Save New Password
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelPasswordChange}
                    className="ms-2"
                  >
                    Cancel
                  </Button>
                </Col>
              </Form>
            )}
          </Col>
          <Col md={6} className="ps-4 border-end border-sm-0 border-bottom">
            <h3>User Details</h3>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={user.firstName || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={user.lastName || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={user.email || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </Form.Group>
            </Form>
          </Col>
        </Row>
        {isOwner && (
          <Row className="mt-4">
            <Col className="text-end">
              {isEditing ? (
                <>
                  <Button variant="success" onClick={handleSave}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    className="ms-2"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="warning" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="ms-2"
                    onClick={handleDeleteProfile}
                  >
                    Delete Profile
                  </Button>
                </>
              )}
            </Col>
          </Row>
        )}
      </Container>

      <Container className="my-4">
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
