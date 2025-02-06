export type Comment = {
  id: string;
  message: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  parentId: string | null;
  user: {
    id: string;
    name: string;
  };
};

export type Post = {
  id: string;
  title: string;
  body: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  updated_at: string;
  imageUrl?: string;
  tags?: Tag[];
  comments: Comment[];
  likeCount: number;
  likedByMe: boolean;
};

export type Tag = {
  id: string;
  name: string;
  Posts?: Post[];
};
