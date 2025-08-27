import request from 'supertest';
import { app, pool } from './server'; // Modify the import according to the correct server setup
import { createUserInputSchema, createContentInputSchema } from './zodschemas';
import { jest } from '@jest/globals';

describe('User API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Database setup if required
    await pool.query('BEGIN');

    // Create and authenticate a user
    const userRes = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', name: 'Test User', password: 'password123' });
    
    authToken = userRes.body.auth_token;
  });

  afterAll(async () => {
    // Database teardown
    await pool.query('ROLLBACK');
    jest.clearAllMocks();
    pool.end();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'newuser@example.com', name: 'New User', password: 'securePassword123' });
      
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('user_id');
      expect(res.body).toHaveProperty('auth_token');
    });

    it('should fail registration with invalid input data', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: 'short' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('auth_token');
    });

    it('should not login with incorrect credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongPassword' });
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /dashboard', () => {
    it('should fetch personalized dashboard', async () => {
      const res = await request(app)
        .get('/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/dashboard');
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /content', () => {
    it('should create new content', async () => {
      const contentInput = { title: 'New Content', description: 'Some content description', creator_id: 'user1', tags: ['test'] };
      
      // Validate using Zod
      const parsedData = createContentInputSchema.safeParse(contentInput);
      expect(parsedData.success).toBeTruthy();
      
      const res = await request(app)
        .post('/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentInput);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('content_id');
    });

    it('should handle content creation with invalid data', async () => {
      const res = await request(app)
        .post('/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '', description: 'Invalid content' });
      
      expect(res.status).toBe(400);
    });
  });

  // Add more tests for other endpoints following the same pattern

});