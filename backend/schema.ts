import { z } from 'zod';

// User entity schema
export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  name: z.string(),
  password: z.string(),
  created_at: z.coerce.date()
});

// Input schema for creating a user
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8),
});

// Input schema for updating a user
export const updateUserInputSchema = z.object({
  user_id: z.string(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(255).optional(),
  password: z.string().min(8).optional(),
});

// User query schema
export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['name', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Content entity schema
export const contentSchema = z.object({
  content_id: z.string(),
  title: z.string(),
  description: z.string(),
  created_at: z.coerce.date(),
  creator_id: z.string(),
  tags: z.array(z.string()).nullable()
});

// Input schema for creating content
export const createContentInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  creator_id: z.string(),
  tags: z.array(z.string()).nullable()
});

// Input schema for updating content
export const updateContentInputSchema = z.object({
  content_id: z.string(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).nullable().optional()
});

// Content query schema
export const searchContentInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['title', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Comment entity schema
export const commentSchema = z.object({
  comment_id: z.string(),
  content_id: z.string(),
  user_id: z.string(),
  comment_text: z.string(),
  created_at: z.coerce.date(),
  parent_comment_id: z.string().nullable()
});

// Input schema for creating a comment
export const createCommentInputSchema = z.object({
  content_id: z.string(),
  user_id: z.string(),
  comment_text: z.string().min(1),
  parent_comment_id: z.string().nullable()
});

// Input schema for updating a comment
export const updateCommentInputSchema = z.object({
  comment_id: z.string(),
  comment_text: z.string().min(1).optional(),
});

// Comment query schema
export const searchCommentInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Like entity schema
export const likeSchema = z.object({
  like_id: z.string(),
  content_id: z.string(),
  user_id: z.string(),
  created_at: z.coerce.date()
});

// Input schema for creating a like
export const createLikeInputSchema = z.object({
  content_id: z.string(),
  user_id: z.string()
});

// Like query schema
export const searchLikeInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// UserSettings entity schema
export const userSettingsSchema = z.object({
  user_settings_id: z.string(),
  user_id: z.string(),
  categories: z.array(z.string()).nullable(),
  notifications_enabled: z.boolean()
});

// Input schema for updating user settings
export const updateUserSettingsInputSchema = z.object({
  user_settings_id: z.string(),
  categories: z.array(z.string()).nullable().optional(),
  notifications_enabled: z.boolean().optional()
});

// Notification entity schema
export const notificationSchema = z.object({
  notification_id: z.string(),
  user_id: z.string(),
  message: z.string(),
  created_at: z.coerce.date(),
  is_read: z.boolean()
});

// Input schema for creating a notification
export const createNotificationInputSchema = z.object({
  user_id: z.string(),
  message: z.string().min(1)
});

// Notification query schema
export const searchNotificationInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Feedback entity schema
export const feedbackSchema = z.object({
  feedback_id: z.string(),
  user_id: z.string().nullable(),
  content_id: z.string().nullable(),
  feedback_text: z.string(),
  created_at: z.coerce.date()
});

// Input schema for creating feedback
export const createFeedbackInputSchema = z.object({
  user_id: z.string().nullable(),
  content_id: z.string().nullable(),
  feedback_text: z.string().min(1)
});

// Feedback query schema
export const searchFeedbackInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Inferred Types
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

export type Content = z.infer<typeof contentSchema>;
export type CreateContentInput = z.infer<typeof createContentInputSchema>;
export type UpdateContentInput = z.infer<typeof updateContentInputSchema>;
export type SearchContentInput = z.infer<typeof searchContentInputSchema>;

export type Comment = z.infer<typeof commentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;
export type SearchCommentInput = z.infer<typeof searchCommentInputSchema>;

export type Like = z.infer<typeof likeSchema>;
export type CreateLikeInput = z.infer<typeof createLikeInputSchema>;
export type SearchLikeInput = z.infer<typeof searchLikeInputSchema>;

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsInputSchema>;

export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;
export type SearchNotificationInput = z.infer<typeof searchNotificationInputSchema>;

export type Feedback = z.infer<typeof feedbackSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackInputSchema>;
export type SearchFeedbackInput = z.infer<typeof searchFeedbackInputSchema>;