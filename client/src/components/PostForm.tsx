import { useUser } from "../hooks/useUser";
import React, { useState } from "react";
import { Form, Button, Row, Col, Stack } from "react-bootstrap";
import CreatableReactSelect from "react-select/creatable";
import { useNavigate } from "react-router-dom";

interface PostFormState {
  title: string;
  body: string;
  image: File | null;
  imagePreview: string | null;
  tags: { label: string; value: string }[];
}

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
  const currentUser = useUser();
  const navigate = useNavigate();

  const [formState, setFormState] = useState<PostFormState>({
    title: title || "",
    body: body || "",
    image: null,
    imagePreview: imgUrl || null,
    tags: initialTags?.map((tag: string) => ({ label: tag, value: tag })) || [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    e.preventDefault();
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setFormState((prevState) => ({
        ...prevState,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleTagsChange = (selectedOptions: any) => {
    setFormState((prevState) => ({
      ...prevState,
      tags: selectedOptions || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      formState.title,
      formState.body,
      currentUser?.id || "",
      formState.image || new File([], ""),
      formState.tags.map((tag) => tag.value),
    );
    navigate(-1);
  };

  return (
    <Form onSubmit={handleSubmit} className="my-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            name="title"
            value={formState.title}
            onChange={handleInputChange}
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
                setFormState((prevState) => ({
                  ...prevState,
                  tags: [...prevState.tags, newTag],
                }));
              }}
              value={formState.tags}
              options={availableTags?.map((tag) => ({
                label: tag,
                value: tag,
              }))}
              onChange={handleTagsChange}
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
          {formState.imagePreview && (
            <img
              src={formState.imagePreview}
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
          name="body"
          value={formState.body}
          onChange={handleInputChange}
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
