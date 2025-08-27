-- Create tables

CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'User'
);

CREATE TABLE tasks (
    task_id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR,
    due_date VARCHAR,
    created_at VARCHAR NOT NULL,
    updated_at VARCHAR,
    tags VARCHAR[],
    filter_status VARCHAR DEFAULT 'incomplete',
    assigned_users VARCHAR[],
    created_by VARCHAR NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE comments (
    comment_id VARCHAR PRIMARY KEY,
    task_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE notifications (
    notification_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    task_id VARCHAR,
    content VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

CREATE TABLE user_preferences (
    user_id VARCHAR PRIMARY KEY,
    theme VARCHAR NOT NULL DEFAULT 'light',
    notification_preferences JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE role_permissions (
    role VARCHAR PRIMARY KEY,
    permissions VARCHAR[] NOT NULL
);

CREATE TABLE admin_reports (
    report_id VARCHAR PRIMARY KEY,
    generated_by VARCHAR NOT NULL,
    content JSON NOT NULL,
    created_at VARCHAR NOT NULL,
    FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

-- Seed data

-- Users
INSERT INTO users (user_id, email, name, password_hash, created_at, role) VALUES
('user1', 'user1@example.com', 'John Doe', 'password123', '2023-10-01T10:00:00Z', 'User'),
('user2', 'user2@example.com', 'Jane Smith', 'user123', '2023-10-02T10:00:00Z', 'Admin'),
('user3', 'user3@example.com', 'Alice Brown', 'admin123', '2023-10-03T10:00:00Z', 'User');

-- Tasks
INSERT INTO tasks (task_id, title, description, due_date, created_at, updated_at, tags, filter_status, assigned_users, created_by) VALUES
('task1', 'Task One', 'First test task', '2023-12-01T15:00:00Z', '2023-10-01T10:00:00Z', NULL, ARRAY['test', 'first'], 'incomplete', ARRAY['user1'], 'user1'),
('task2', 'Task Two', 'Second test task', NULL, '2023-10-02T10:00:00Z', NULL, ARRAY['test', 'second'], 'complete', ARRAY['user2'], 'user2');

-- Comments
INSERT INTO comments (comment_id, task_id, user_id, content, created_at) VALUES
('comment1', 'task1', 'user1', 'This is a comment on Task One', '2023-10-01T12:00:00Z'),
('comment2', 'task1', 'user2', 'Another comment on Task One', '2023-10-01T13:00:00Z');

-- Notifications
INSERT INTO notifications (notification_id, user_id, task_id, content, created_at, is_read) VALUES
('notif1', 'user1', 'task1', 'You have been assigned a new task: Task One', '2023-10-01T10:01:00Z', FALSE),
('notif2', 'user2', NULL, 'A new task has been completed', '2023-10-03T10:02:00Z', TRUE);

-- User Preferences
INSERT INTO user_preferences (user_id, theme, notification_preferences) VALUES
('user1', 'dark', NULL),
('user2', 'light', '{"email": false, "sms": true}'),
('user3', 'light', '{"email": true}');

-- Role Permissions
INSERT INTO role_permissions (role, permissions) VALUES
('User', ARRAY['read_tasks', 'comment']),
('Admin', ARRAY['manage_users', 'read_tasks', 'manage_tasks']);

-- Admin Reports
INSERT INTO admin_reports (report_id, generated_by, content, created_at) VALUES
('report1', 'user2', '{"summary": "Monthly report content"}', '2023-10-31T10:00:00Z');