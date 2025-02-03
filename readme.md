# WebApp - Post, Comment, and Media Platform

This is a web application built with **TypeScript** (for the frontend) and **Golang** (for the backend). Users can create posts, add media (text, photos, or videos), edit posts, manage comments (add, edit, delete), like comments, and organize content with tags. The application also includes user authentication using cookies for session management.

---

## Features

### User Authentication

- **Login/Logout**: Users can securely log in and log out of the platform using a username and password.
- **Session Management**: Uses cookies for authentication and user session tracking.

### Posts

- **Create Post**: Users can create a post with text, images, or videos.
- **Edit Post**: Users can update their posts.
- **Delete Post**: Users can delete posts they created.
- **Tags**: Posts can be tagged with relevant keywords for categorization.
- **Media Support**: You can upload photos or videos along with text in a post. The media is stored on AWS.

### Comments

- **Add Comments**: Users can leave comments on posts.
- **Edit/Delete Comments**: Users can edit or delete their own comments.
- **Comment Replies**: Comments support nested replies to create threaded discussions.
- **Like Comments**: Users can like comments they find helpful or interesting.

### File Storage

- **AWS Integration**: All uploaded media (photos, videos) are stored securely on AWS S3.

---

## Tech Stack

### Frontend

- **TypeScript**: Static typing for better development experience and reliability.
- **React.js** (or similar framework/library of your choice) for building the user interface.
- **Axios** or **Fetch API** for making HTTP requests to the backend.
- **CSS/SCSS** or **TailwindCSS** for styling.

### Backend

- **Golang**: Fast, efficient backend logic for managing posts, comments, and user authentication.
- **GORM**: ORM for handling interactions with the PostgreSQL database.
- **PostgreSQL**: Relational database for storing user data, posts, comments, and tags.
- **AWS S3**: Cloud storage for media files like images and videos.
- **JWT/Cookies**: For secure user authentication and session management.
