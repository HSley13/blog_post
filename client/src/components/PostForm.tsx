import { useUser } from "../hooks/useUser";
import React from "react";
import { Form, Button, Row, Col, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState } from "react";
import CreatableReactSelect from "react-select/creatable";
import { useNavigate } from "react-router-dom";

type PostFormProps = {
  onSubmit: (
    title: string,
    body: string,
    userId: string,
    image: File,
    returnTags?: string[],
  ) => Promise<void>;
  loading: boolean;
  error: Error | undefined;
  title: string;
  body: string;
  imgUrl?: string;
  availableTags?: string[];
  initialTags?: string[];
};

export const PostForm = ({
  onSubmit,
  loading,
  error,
  title,
  body,
  imgUrl,
  availableTags,
  initialTags,
}: PostFormProps) => {
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const currentUser = useUser();
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(imgUrl);
  const [tagsValue, setTagsValue] = useState<
    { label: string; value: string }[]
  >(initialTags?.map((tag: string) => ({ label: tag, value: tag })) || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      titleRef.current!.value,
      bodyRef.current!.value,
      currentUser?.id || "",
      image || new File([], ""),
      tagsValue.map((tag) => tag.value),
    );
    titleRef.current!.value = "";
    bodyRef.current!.value = "";
    setImage(null);
    setImagePreview(null);
    setTagsValue([]);
    navigate(-1);
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
          <Form.Label>Title</Form.Label>
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
            <Form.Label>Tags</Form.Label>
            <CreatableReactSelect
              onCreateOption={(label) => {
                const newTag = { label, value: label };
                setTagsValue((prev) => [...prev, newTag]);
              }}
              value={tagsValue}
              options={availableTags?.map((tag) => ({
                label: tag,
                value: tag,
              }))}
              onChange={(selectedOptions) => {
                if (selectedOptions) {
                  setTagsValue(
                    selectedOptions as { label: string; value: string }[],
                  );
                } else {
                  setTagsValue([]);
                }
              }}
              isMulti
            />
          </Form.Group>
        </Col>
      </Row>
      <Col className="mb-3">
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
      <Col className="mb-3">
        <Form.Control
          as="textarea"
          defaultValue={body || ""}
          ref={bodyRef}
          rows={10}
          placeholder="Add body"
          disabled={loading}
        />
        {error && <p className="text-danger">{error.message}</p>}
      </Col>
      <Stack direction="horizontal" gap={2} className="justify-content-end">
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
      </Stack>
    </Form>
  );
};
