import React from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

type CommentFormProps = {
  onSubmit: (message: string) => void;
  loading: boolean;
  error: Error | undefined;
  autoFocus?: boolean;
  initialValue?: string;
};

export const CommentForm = ({
  onSubmit,
  loading,
  error,
  autoFocus = false,
  initialValue = "",
}: CommentFormProps) => {
  const commentRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(commentRef.current!.value);
    commentRef.current!.value = "";
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="align-items-center">
        <Col>
          <Form.Control
            autoFocus={autoFocus}
            type="text"
            ref={commentRef}
            defaultValue={initialValue}
            placeholder="Add comment"
            disabled={loading}
          />
        </Col>
        <Col xs="auto">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </Button>
        </Col>
      </Row>

      {error && <div className="text-danger mt-2">{error.message}</div>}
    </Form>
  );
};
