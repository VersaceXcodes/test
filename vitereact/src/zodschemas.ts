import { z } from 'zod';

// Frontend-shared schemas and types
// Note: These mirror backend types closely for validation on the client.

export const contentSchema = z.object({
  content_id: z.string(),
  title: z.string(),
  description: z.string(),
  created_at: z.coerce.date(),
  creator_id: z.string(),
  tags: z.array(z.string()).nullable().optional(),
});

export type Content = z.infer<typeof contentSchema>;

export const createContentInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  creator_id: z.string(),
  tags: z.array(z.string()).nullable().optional(),
});

export const commentSchema = z.object({
  comment_id: z.string(),
  content_id: z.string(),
  user_id: z.string(),
  comment_text: z.string(),
  created_at: z.coerce.date(),
  parent_comment_id: z.string().nullable().optional(),
});

export type Comment = z.infer<typeof commentSchema>;

export const userSettingsSchema = z.object({
  user_settings_id: z.string().optional(),
  user_id: z.string().optional(),
  categories: z.array(z.string()).nullable().optional(),
  notifications_enabled: z.boolean(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
