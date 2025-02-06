import { useUser } from "../hooks/useUser";
import React from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { useState } from "react";

type PostFormProps = {
  onSubmit: (
    title: string,
    body: string,
    userId: string,
    image: File,
  ) => Promise<void>;
  loading: boolean;
  error: Error | undefined;
  title?: string;
  body?: string;
  imgUrl?: string;
};
export const PostForm = ({
  onSubmit,
  loading,
  error,
  title,
  body,
  imgUrl,
}: PostFormProps) => {
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const currentUser = useUser();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(imgUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (image) {
      console.log("PostForm: image is defined");
    }
    onSubmit(
      titleRef.current!.value,
      bodyRef.current!.value,
      currentUser?.id || "",
      image || new File([], ""),
    );
    titleRef.current!.value = "";
    bodyRef.current!.value = "";
    setImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3 align-items-center">
        <Col>
          <Form.Control
            type="text"
            ref={titleRef}
            defaultValue={title || ""}
            placeholder="Add title"
            disabled={loading}
          />
        </Col>
        <Col>
          <Form.Group>
            <Form.Control
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2"
                style={{ maxHeight: "200px", maxWidth: "100%" }}
              />
            )}
          </Form.Group>
        </Col>
      </Row>
      <Col className="mb-3">
        <Form.Control
          as="textarea"
          defaultValue={body || ""}
          ref={bodyRef}
          rows={3}
          placeholder="Add body"
          disabled={loading}
        />
        {error && <p className="text-danger">{error.message}</p>}
      </Col>
      <Col className="text-end">
        <Button type="submit" variant="primary" disabled={loading}>
          Submit
        </Button>
      </Col>
    </Form>
  );
};
