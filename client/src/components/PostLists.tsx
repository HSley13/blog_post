import { useState, useEffect } from "react";
import { getPosts } from "../services/posts";
import { Link } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";

export const PostList = () => {
  const { loading, error, value: posts } = useAsync(getPosts);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <h1 className="error-msg">{error}</h1>;
  }

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
};
