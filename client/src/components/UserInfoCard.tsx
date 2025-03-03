import React, { useState, useEffect } from "react";
import { Col, Row, Card, Form, Image, Button } from "react-bootstrap";
import "../styles/AuthForm.css";

type UserInfoCardProps = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    imageUrl: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  isOwner: boolean;
  onDeleteUser: () => void;
  onUpdateUserInfo: (userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    file?: File | null;
  }) => Promise<void>;
  onUpdatePassword: (passwords: { newPassword: string }) => Promise<void>;
};

export const UserInfoCard = ({
  user,
  isOwner,
  onDeleteUser,
  onUpdateUserInfo,
  onUpdatePassword,
}: UserInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const validateFields = (fields: Record<string, string>) => {
    const newErrors: Record<string, boolean> = {};
    Object.keys(fields).forEach((key) => {
      newErrors[key] = !fields[key];
    });

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalUser((prevUser) => ({
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
    await onUpdateUserInfo({
      firstName: localUser.firstName || "",
      lastName: localUser.lastName || "",
      email: localUser.email || "",
      file: image,
    });

    setIsEditing(false);
    setImage(null);
    setImagePreview(null);
  };

  const handleChangePassword = async () => {
    if (
      !validateFields({
        newPassword: localUser.newPassword || "",
        confirmPassword: localUser.confirmPassword || "",
      })
    ) {
      return;
    }

    if (localUser.newPassword !== localUser.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    await onUpdatePassword({
      newPassword: localUser.newPassword || "",
    });

    setIsChangingPassword(false);
    setLocalUser((prevUser) => ({
      ...prevUser,
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setImage(null);
    setImagePreview(null);
    setLocalUser(user);
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setLocalUser((prevUser) => ({
      ...prevUser,
      newPassword: "",
      confirmPassword: "",
    }));
  };

  return (
    <Card className="my-4 mb-4">
      <Card.Body>
        <Row>
          <Col className="text-center mb-2">
            <Card.Title>Profile Picture</Card.Title>
            <Image
              src={imagePreview || localUser.imageUrl}
              roundedCircle
              fluid
              className="align-self-center mb-3"
              style={{ width: "250px", height: "250px" }}
            />
            {isOwner && !isChangingPassword && (
              <Col className="mt-2">
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
                <Form.Control
                  className={`my-3 ${errors.newPassword ? "invalid" : ""}`}
                  type="password"
                  name="newPassword"
                  value={localUser.newPassword}
                  placeholder="Enter new password"
                  onChange={handleInputChange}
                />
                <Form.Control
                  className={`my-3 ${errors.confirmPassword ? "invalid" : ""}`}
                  type="password"
                  name="confirmPassword"
                  value={localUser.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                />
                <Col>
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
          <Col>
            <Card.Title>User Details</Card.Title>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={localUser.firstName || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={localUser.lastName || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={localUser.email || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </Form.Group>
            </Form>
          </Col>
        </Row>
        {isOwner && (
          <Row>
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
                    onClick={onDeleteUser}
                  >
                    Delete Profile
                  </Button>
                </>
              )}
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};
