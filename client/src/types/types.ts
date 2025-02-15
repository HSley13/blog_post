export type Comment = {
  id: string;
  message: string;
  createdAt: string;
  updatedAt: string;
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
  body: string;
  user: {
    id: string;
    name: string;
  };
  title: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  tags?: Tag[];
  comments: Comment[];
  likeCount: number;
  likedByMe: boolean;
};

export type Tag = {
  id: string;
  name: string;
  posts?: Post[];
};
