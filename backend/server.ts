import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt, { JwtPayload } from 'jsonwebtoken';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Import Zod schemas
import {
  userSchema, createUserInputSchema, updateUserInputSchema,
  contentSchema, createContentInputSchema, updateContentInputSchema, searchContentInputSchema,
  commentSchema, createCommentInputSchema, updateCommentInputSchema,
  likeSchema, createLikeInputSchema,
  userSettingsSchema, updateUserSettingsInputSchema,
  notificationSchema, createNotificationInputSchema, searchNotificationInputSchema
} from './schema';

import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

dotenv.config();

// Extend Express Request to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        email: string;
        name?: string;
        created_at?: string;
      };
    }
  }
}

// Error response utility
type ErrorResponse = {
  success: false;
  message: string;
  timestamp: string;
  error_code?: string;
  details?: { name: string; message: string; stack?: string };
};

function createErrorResponse(message: string, error: any = null, errorCode: string | null = null): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error && process.env.NODE_ENV === 'development') {
    response.details = {
      name: (error as any).name,
      message: (error as any).message,
      stack: (error as any).stack
    };
  }

  return response;
}

// PGlite database setup
const { JWT_SECRET = 'your-secret-key' } = process.env;

const db = new PGlite('./db');

// Initialize database with schema
const initializeDatabase = async () => {
  try {
    const schema = fs.readFileSync('./db.sql', 'utf-8');
    const commands = schema.split(/(?=CREATE TABLE |INSERT INTO)/);
    
    for (const cmd of commands) {
      if (cmd.trim()) {
        await db.query(cmd);
      }
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.log('Database initialization skipped (may already exist):', (error as any).message);
  }
};

initializeDatabase();

// Adapter for PGlite to work with pg-style code
const pool = {
  async connect() {
    return {
      async query(sql: string, params?: any[]) {
        const result = await db.query(sql, params);
        return result;
      },
      release() {
      }
    };
  }
};

const app = express();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT) || 3000;

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/*
  Authentication middleware for protected routes
  Validates JWT token and attaches user info to request object
*/
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
      
      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid token - user not found', null, 'AUTH_USER_NOT_FOUND'));
      }

      req.user = result.rows[0];
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
  User registration endpoint
  Creates new user account and returns JWT token
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedInput = createUserInputSchema.parse(req.body);
    const { email, name, password } = validatedInput;

    const client = await pool.connect();
    
    try {
      // Check if user already exists
      const existingUser = await client.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
      }

      // Create new user (no password hashing for development)
      const user_id = uuidv4();
      const created_at = new Date().toISOString();
      
      const result = await client.query(
        'INSERT INTO users (user_id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, name, created_at',
        [user_id, email.toLowerCase().trim(), name.trim(), password, created_at]
      );

      const user = result.rows[0];

      // Create default user settings
      const user_settings_id = uuidv4();
      await client.query(
        'INSERT INTO user_settings (user_settings_id, user_id, categories, notifications_enabled) VALUES ($1, $2, $3, $4)',
        [user_settings_id, user_id, [], true]
      );

      // Generate JWT token
      const auth_token = jwt.sign(
        { user_id: user.user_id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.status(201).json({
        auth_token,
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  User login endpoint
  Authenticates user credentials and returns JWT token
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    try {
      // Find user and validate password (direct comparison for development)
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (result.rows.length === 0) {
        return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
      }

      const user = result.rows[0];

      if (password !== user.password_hash) {
        return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
      }

      // Generate JWT token
      const auth_token = jwt.sign(
        { user_id: user.user_id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({
        auth_token,
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Password recovery endpoint
  @@need:external-api: Email service API to send password recovery emails with reset links
*/
async function sendPasswordRecoveryEmail({ email, reset_token }) {
  // Mock email sending functionality
  // This should be replaced with actual email service integration
  console.log(`Password recovery email would be sent to: ${email} with token: ${reset_token}`);
  
  return {
    success: true,
    message: "Password recovery email sent successfully",
    email_sent_at: new Date().toISOString()
  };
}

app.post('/api/auth/password-recovery', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    try {
      // Check if user exists
      const result = await client.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (result.rows.length === 0) {
        // For security, return success even if user doesn't exist
        return res.json({ message: 'If an account with that email exists, password recovery instructions have been sent.' });
      }

      // Generate reset token (mock implementation)
      const reset_token = uuidv4();
      
      // Send recovery email (mocked)
      await sendPasswordRecoveryEmail({ email, reset_token });

      res.json({ message: 'If an account with that email exists, password recovery instructions have been sent.' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Password recovery error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get user profile endpoint
  Returns user profile information by user_id
*/
app.get('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [user_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get personalized dashboard content
  Returns content filtered by user preferences and interactions
*/
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.query as { user_id?: string };

    if (!user_id) {
      return res.status(400).json(createErrorResponse('user_id query parameter is required', null, 'MISSING_REQUIRED_PARAMETER'));
    }

    const client = await pool.connect();
    
    try {
      // Get user settings for content personalization
      const settingsResult = await client.query('SELECT categories FROM user_settings WHERE user_id = $1', [user_id]);
      
      let contentQuery = `
        SELECT c.content_id, c.title, c.description, c.created_at, c.creator_id, c.tags,
               u.name as creator_name,
               COUNT(DISTINCT l.like_id) as like_count,
               COUNT(DISTINCT cm.comment_id) as comment_count
        FROM content c
        LEFT JOIN users u ON c.creator_id = u.user_id
        LEFT JOIN likes l ON c.content_id = l.content_id
        LEFT JOIN comments cm ON c.content_id = cm.content_id
        GROUP BY c.content_id, c.title, c.description, c.created_at, c.creator_id, c.tags, u.name
        ORDER BY c.created_at DESC
        LIMIT 20
      `;

      const contentResult = await client.query(contentQuery);

      res.json(contentResult.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Search content endpoint
  Returns filtered and paginated content based on search parameters
*/
app.get('/api/content', async (req, res) => {
  try {
    const queryParams = {
      query: typeof req.query.query === 'string' ? req.query.query : '',
      limit: parseInt(String(req.query.limit)) || 10,
      offset: parseInt(String(req.query.offset)) || 0,
      sort_by: typeof req.query.sort_by === 'string' ? req.query.sort_by : 'created_at',
      sort_order: typeof req.query.sort_order === 'string' ? req.query.sort_order : 'desc'
    };

    // Validate using Zod schema
    const validatedParams = searchContentInputSchema.parse(queryParams);

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT c.content_id, c.title, c.description, c.created_at, c.creator_id, c.tags,
               u.name as creator_name,
               COUNT(DISTINCT l.like_id) as like_count,
               COUNT(DISTINCT cm.comment_id) as comment_count
        FROM content c
        LEFT JOIN users u ON c.creator_id = u.user_id
        LEFT JOIN likes l ON c.content_id = l.content_id
        LEFT JOIN comments cm ON c.content_id = cm.content_id
      `;
      
      const queryValues = [];
      let whereClause = '';

      if (validatedParams.query) {
        whereClause = ' WHERE (c.title ILIKE $1 OR c.description ILIKE $1)';
        queryValues.push(`%${validatedParams.query}%`);
      }

      query += whereClause;
      query += ` GROUP BY c.content_id, c.title, c.description, c.created_at, c.creator_id, c.tags, u.name`;
      query += ` ORDER BY c.${validatedParams.sort_by} ${validatedParams.sort_order.toUpperCase()}`;
      query += ` LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}`;
      
      queryValues.push(validatedParams.limit, validatedParams.offset);

      const result = await client.query(query, queryValues);

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid query parameters', error, 'VALIDATION_ERROR'));
    }
    console.error('Search content error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new content endpoint
  Creates a new content item and returns the created content
*/
app.post('/api/content', authenticateToken, async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedInput = createContentInputSchema.parse(req.body);

    const content_id = uuidv4();
    const created_at = new Date().toISOString();

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'INSERT INTO content (content_id, title, description, created_at, creator_id, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [content_id, validatedInput.title, validatedInput.description, created_at, validatedInput.creator_id, validatedInput.tags]
      );

      // Create notification for content creation
      const notification_id = uuidv4();
      await client.query(
        'INSERT INTO notifications (notification_id, user_id, message, created_at, is_read) VALUES ($1, $2, $3, $4, $5)',
        [notification_id, validatedInput.creator_id, `Your content "${validatedInput.title}" has been published!`, created_at, false]
      );

      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Create content error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get content details endpoint
  Returns detailed information about a specific content item
*/
app.get('/api/content/:content_id', async (req, res) => {
  try {
    const { content_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT c.content_id, c.title, c.description, c.created_at, c.creator_id, c.tags,
               u.name as creator_name,
               COUNT(DISTINCT l.like_id) as like_count,
               COUNT(DISTINCT cm.comment_id) as comment_count
        FROM content c
        LEFT JOIN users u ON c.creator_id = u.user_id
        LEFT JOIN likes l ON c.content_id = l.content_id
        LEFT JOIN comments cm ON c.content_id = cm.content_id
        WHERE c.content_id = $1
        GROUP BY c.content_id, c.title, c.description, c.created_at, c.creator_id, c.tags, u.name
      `, [content_id]);

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Content not found', null, 'CONTENT_NOT_FOUND'));
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get content details error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update content endpoint
  Updates existing content and returns the updated content
*/
app.put('/api/content/:content_id', authenticateToken, async (req, res) => {
  try {
    const { content_id } = req.params;
    const validatedInput = updateContentInputSchema.parse({ ...req.body, content_id });

    const client = await pool.connect();
    
    try {
      // Check if content exists and user has permission
      const contentCheck = await client.query('SELECT creator_id FROM content WHERE content_id = $1', [content_id]);
      
      if (contentCheck.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Content not found', null, 'CONTENT_NOT_FOUND'));
      }

      if (contentCheck.rows[0].creator_id !== req.user.user_id) {
        return res.status(403).json(createErrorResponse('Not authorized to update this content', null, 'UNAUTHORIZED'));
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedInput.title !== undefined) {
        updateFields.push(`title = $${paramCount}`);
        updateValues.push(validatedInput.title);
        paramCount++;
      }

      if (validatedInput.description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        updateValues.push(validatedInput.description);
        paramCount++;
      }

      if (validatedInput.tags !== undefined) {
        updateFields.push(`tags = $${paramCount}`);
        updateValues.push(validatedInput.tags);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(content_id);

      const result = await client.query(
        `UPDATE content SET ${updateFields.join(', ')} WHERE content_id = $${paramCount} RETURNING *`,
        updateValues
      );

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update content error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete content endpoint
  Removes content and all associated comments and likes
*/
app.delete('/api/content/:content_id', authenticateToken, async (req, res) => {
  try {
    const { content_id } = req.params;

    const client = await pool.connect();
    
    try {
      // Check if content exists and user has permission
      const contentCheck = await client.query('SELECT creator_id FROM content WHERE content_id = $1', [content_id]);
      
      if (contentCheck.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Content not found', null, 'CONTENT_NOT_FOUND'));
      }

      if (contentCheck.rows[0].creator_id !== req.user.user_id) {
        return res.status(403).json(createErrorResponse('Not authorized to delete this content', null, 'UNAUTHORIZED'));
      }

      // Delete associated records first (cascading delete)
      await client.query('DELETE FROM comments WHERE content_id = $1', [content_id]);
      await client.query('DELETE FROM likes WHERE content_id = $1', [content_id]);
      await client.query('DELETE FROM feedback WHERE content_id = $1', [content_id]);

      // Delete the content
      await client.query('DELETE FROM content WHERE content_id = $1', [content_id]);

      res.status(204).send();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get comments for content endpoint
  Returns all comments for a specific content item with threading support
*/
app.get('/api/content/:content_id/comments', async (req, res) => {
  try {
    const { content_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT c.comment_id, c.content_id, c.user_id, c.comment_text, c.created_at, c.parent_comment_id,
               u.name as user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.content_id = $1
        ORDER BY c.created_at ASC
      `, [content_id]);

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create comment endpoint
  Adds a new comment to content and handles threading
*/
app.post('/api/content/:content_id/comments', authenticateToken, async (req, res) => {
  try {
    const { content_id } = req.params;
    const validatedInput = createCommentInputSchema.parse({ ...req.body, content_id });

    const comment_id = uuidv4();
    const created_at = new Date().toISOString();

    const client = await pool.connect();
    
    try {
      // Check if content exists
      const contentCheck = await client.query('SELECT creator_id FROM content WHERE content_id = $1', [content_id]);
      if (contentCheck.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Content not found', null, 'CONTENT_NOT_FOUND'));
      }

      // Check if parent comment exists (if provided)
      if (validatedInput.parent_comment_id) {
        const parentCheck = await client.query('SELECT comment_id FROM comments WHERE comment_id = $1', [validatedInput.parent_comment_id]);
        if (parentCheck.rows.length === 0) {
          return res.status(404).json(createErrorResponse('Parent comment not found', null, 'PARENT_COMMENT_NOT_FOUND'));
        }
      }

      const result = await client.query(
        'INSERT INTO comments (comment_id, content_id, user_id, comment_text, created_at, parent_comment_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [comment_id, content_id, validatedInput.user_id, validatedInput.comment_text, created_at, validatedInput.parent_comment_id]
      );

      // Create notification for content creator
      const notification_id = uuidv4();
      const content_creator_id = contentCheck.rows[0].creator_id;
      
      if (content_creator_id !== validatedInput.user_id) {
        await client.query(
          'INSERT INTO notifications (notification_id, user_id, message, created_at, is_read) VALUES ($1, $2, $3, $4, $5)',
          [notification_id, content_creator_id, `Someone commented on your content!`, created_at, false]
        );
      }

      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Create comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update comment endpoint
  Updates an existing comment if user has permission
*/
app.put('/api/comments/:comment_id', authenticateToken, async (req, res) => {
  try {
    const { comment_id } = req.params;
    const validatedInput = updateCommentInputSchema.parse({ ...req.body, comment_id });

    const client = await pool.connect();
    
    try {
      // Check if comment exists and user has permission
      const commentCheck = await client.query('SELECT user_id FROM comments WHERE comment_id = $1', [comment_id]);
      
      if (commentCheck.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
      }

      if (commentCheck.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json(createErrorResponse('Not authorized to update this comment', null, 'UNAUTHORIZED'));
      }

      const result = await client.query(
        'UPDATE comments SET comment_text = $1 WHERE comment_id = $2 RETURNING *',
        [validatedInput.comment_text, comment_id]
      );

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete comment endpoint
  Removes a comment if user has permission
*/
app.delete('/api/comments/:comment_id', authenticateToken, async (req, res) => {
  try {
    const { comment_id } = req.params;

    const client = await pool.connect();
    
    try {
      // Check if comment exists and user has permission
      const commentCheck = await client.query('SELECT user_id FROM comments WHERE comment_id = $1', [comment_id]);
      
      if (commentCheck.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
      }

      if (commentCheck.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json(createErrorResponse('Not authorized to delete this comment', null, 'UNAUTHORIZED'));
      }

      // Delete child comments first
      await client.query('DELETE FROM comments WHERE parent_comment_id = $1', [comment_id]);
      
      // Delete the comment
      await client.query('DELETE FROM comments WHERE comment_id = $1', [comment_id]);

      res.status(204).send();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Like content endpoint
  Adds or removes a like for content (toggle functionality)
*/
app.post('/api/content/:content_id/likes', authenticateToken, async (req, res) => {
  try {
    const { content_id } = req.params;
    const validatedInput = createLikeInputSchema.parse({ ...req.body, content_id });

    const client = await pool.connect();
    
    try {
      // Check if content exists
      const contentCheck = await client.query('SELECT creator_id FROM content WHERE content_id = $1', [content_id]);
      if (contentCheck.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Content not found', null, 'CONTENT_NOT_FOUND'));
      }

      // Check if user already liked this content
      const existingLike = await client.query('SELECT like_id FROM likes WHERE content_id = $1 AND user_id = $2', [content_id, validatedInput.user_id]);
      
      if (existingLike.rows.length > 0) {
        // Unlike (remove like)
        await client.query('DELETE FROM likes WHERE content_id = $1 AND user_id = $2', [content_id, validatedInput.user_id]);
        return res.status(204).send();
      }

      // Add like
      const like_id = uuidv4();
      const created_at = new Date().toISOString();

      const result = await client.query(
        'INSERT INTO likes (like_id, content_id, user_id, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [like_id, content_id, validatedInput.user_id, created_at]
      );

      // Create notification for content creator
      const notification_id = uuidv4();
      const content_creator_id = contentCheck.rows[0].creator_id;
      
      if (content_creator_id !== validatedInput.user_id) {
        await client.query(
          'INSERT INTO notifications (notification_id, user_id, message, created_at, is_read) VALUES ($1, $2, $3, $4, $5)',
          [notification_id, content_creator_id, `Someone liked your content!`, created_at, false]
        );
      }

      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Like content error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get notifications endpoint
  Returns paginated notifications for a user
*/
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
     const { user_id } = req.query as { user_id?: string; limit?: string | number; offset?: string | number };
     const limit = parseInt(String((req.query as any).limit ?? 10));
     const offset = parseInt(String((req.query as any).offset ?? 0));

    if (!user_id) {
      return res.status(400).json(createErrorResponse('user_id query parameter is required', null, 'MISSING_REQUIRED_PARAMETER'));
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT notification_id, user_id, message, created_at, is_read
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
       `, [user_id as string, limit, offset]);

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get user settings endpoint
  Returns user preferences and settings
*/
app.get('/api/user-settings', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.query as { user_id?: string };

    if (!user_id) {
      return res.status(400).json(createErrorResponse('user_id query parameter is required', null, 'MISSING_REQUIRED_PARAMETER'));
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM user_settings WHERE user_id = $1', [user_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User settings not found', null, 'USER_SETTINGS_NOT_FOUND'));
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update user settings endpoint
  Updates user preferences and settings
*/
app.patch('/api/user-settings', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.query as { user_id?: string };

    if (!user_id) {
      return res.status(400).json(createErrorResponse('user_id query parameter is required', null, 'MISSING_REQUIRED_PARAMETER'));
    }

    const validatedInput = updateUserSettingsInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      // Check if user settings exist
      const settingsCheck = await client.query('SELECT user_settings_id FROM user_settings WHERE user_id = $1', [user_id]);
      
      if (settingsCheck.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User settings not found', null, 'USER_SETTINGS_NOT_FOUND'));
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedInput.categories !== undefined) {
        updateFields.push(`categories = $${paramCount}`);
        updateValues.push(validatedInput.categories);
        paramCount++;
      }

      if (validatedInput.notifications_enabled !== undefined) {
        updateFields.push(`notifications_enabled = $${paramCount}`);
        updateValues.push(validatedInput.notifications_enabled);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(user_id);

      const result = await client.query(
        `UPDATE user_settings SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
        updateValues
      );

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update user settings error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA catch-all: serve index.html for non-API routes only
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on 0.0.0.0`);
});