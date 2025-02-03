import { Link } from "react-router-dom";
import { Card, Badge, Stack } from "react-bootstrap";
import styles from "../modules/CommentCard.module.css";

type CommentCardProps = {
  id: string;
  title: string;
  updatedAt: string;
};
export const CommentCard = ({ id, title, updatedAt }: CommentCardProps) => {
  return (
    <Card
      as={Link}
      to={`/posts/${id}`}
      className={`h-100 text-reset text-decoration-none ${styles.card}`}
    >
      <Card.Body>
        <Stack gap={2}>
          <Stack direction="horizontal" gap={3}>
            <Badge bg="primary" className="fs-6">
              {title}
            </Badge>
            <div className="ms-auto">
              <small className="text-muted">{updatedAt}</small>
            </div>
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
};
