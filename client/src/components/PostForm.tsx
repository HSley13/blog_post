import { useUser } from "../hooks/useUser";
import React from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

type PostFormProps = {
  onSubmit: (title: string, body: string, userId: string) => void;
  loading: boolean;
  error: Error | undefined;
};
export const PostForm = ({ onSubmit, loading, error }: PostFormProps) => {
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const currentUser = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      titleRef.current!.value,
      bodyRef.current!.value,
      currentUser?.id || "",
    );
    titleRef.current!.value = "";
    bodyRef.current!.value = "";
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3 align-items-center">
        <Col>
          <Form.Control
            type="text"
            ref={titleRef}
            placeholder="Add title"
            disabled={loading}
          />
        </Col>
        <Col xs="auto">
          <Button type="submit" variant="primary" disabled={loading}>
            Submit
          </Button>
        </Col>
      </Row>
      <Col className="mb-3">
        <Form.Control
          as="textarea"
          ref={bodyRef}
          rows={3}
          placeholder="Add body"
          disabled={loading}
        />
        {error && <p className="text-danger">{error.message}</p>}
      </Col>
    </Form>
  );
};
