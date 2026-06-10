const request = require('supertest');
const app = require('../server');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

describe('Auth API Integration Tests', () => {
  let adminToken;
  let testUser;

  beforeAll(async () => {
    // Clear and create a test user
    await prisma.user.deleteMany({ where: { email: 'integration@test.com' } });
    
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'integration@test.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: 'integration@test.com' } });
    await prisma.$disconnect();
  });

  it('should login successfully and return access token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'integration@test.com',
        password: 'testpass123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.headers['set-cookie']).toBeDefined(); // Refresh token
    
    adminToken = response.body.data.accessToken;
  });

  it('should fail login with wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'integration@test.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
  
  it('should revoke tokens successfully', async () => {
    const response = await request(app)
      .post('/api/auth/revoke')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
