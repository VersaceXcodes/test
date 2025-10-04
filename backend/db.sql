-- Create tables

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS content (
    content_id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    created_at VARCHAR NOT NULL,
    creator_id VARCHAR NOT NULL,
    tags TEXT[],
    FOREIGN KEY (creator_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id VARCHAR PRIMARY KEY,
    content_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    comment_text TEXT NOT NULL,
    created_at VARCHAR NOT NULL,
    parent_comment_id VARCHAR,
    FOREIGN KEY (content_id) REFERENCES content(content_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id)
);

CREATE TABLE IF NOT EXISTS likes (
    like_id VARCHAR PRIMARY KEY,
    content_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL,
    FOREIGN KEY (content_id) REFERENCES content(content_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(content_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    message TEXT NOT NULL,
    created_at VARCHAR NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_settings_id VARCHAR PRIMARY KEY,
    user_id VARCHAR UNIQUE NOT NULL,
    categories TEXT[],
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id VARCHAR PRIMARY KEY,
    content_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    feedback_text TEXT NOT NULL,
    created_at VARCHAR NOT NULL,
    FOREIGN KEY (content_id) REFERENCES content(content_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
