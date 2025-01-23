import mongoose from "mongoose";
import request from "supertest";
import postModel from "../models/posts.model";
import userModel from "../models/user.model";

import initApp from "../server";
import { Express } from "express";

var app: Express;

// Add test user credentials
const testUser = {
  email: "test@example.com",
  password: "password123"
};

let accessToken: string;

beforeAll(async () => {
  app = await initApp();
  await postModel.deleteMany({}); // Clear posts
  await userModel.deleteMany({}); // Clear users
  
  // Register test user
  await request(app)
    .post("/users/register")
    .send(testUser);
    
  // Login and get access token
  const loginResponse = await request(app)
    .post("/users/login")
    .send(testUser);
    
  accessToken = loginResponse.body.accessToken;
});

afterAll(async () => {
  console.log("afterAll");
  await mongoose.connection.close();
});

let postId = "";
describe("Posts Tests", () => {
  let postId = "";
  const testPost = {
    title: "Test Post",
    content: "Test Content",
    owner: testUser.email, // Use test user's email as owner
  };

  // GET / - Get all posts
  describe("GET /posts", () => {
    test("Should get empty posts array initially", async () => {
      const response = await request(app)
        .get("/posts")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("Should get all posts after creating some", async () => {
      // Create test posts first
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(testPost);
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ...testPost, title: "Second Post" });

      const response = await request(app)
        .get("/posts")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
    });

    test("Should return empty array for non-existent sender", async () => {
      const response = await request(app)
        .get("/posts?sender=NonExistentOwner")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // POST / - Create post
  describe("POST /posts", () => {
    test("Should create new post successfully", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(testPost);

      expect(response.statusCode).toBe(201);
      expect(response.body.title).toBe(testPost.title);
      expect(response.body.content).toBe(testPost.content);
      expect(response.body.owner).toBe(testPost.owner);
      expect(response.body._id).toBeDefined();

      postId = response.body._id;
    });

    test("Should fail to create post without title", async () => {
      const { title, ...postWithoutTitle } = testPost;
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(postWithoutTitle);
      expect(response.statusCode).toBe(400);
    });

    test("Should fail to create post without owner", async () => {
      const { owner, ...postWithoutOwner } = testPost;
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(postWithoutOwner);
      expect(response.statusCode).toBe(400);
    });

    test("Should fail without authentication", async () => {
      const response = await request(app)
        .post("/posts")
        .send(testPost);
      expect(response.statusCode).toBe(401);
    });
  });

  // GET /post - Get posts by sender
  describe("GET /posts/post", () => {

    test("Should return empty array for non-existent sender using /post endpoint", async () => {
      const response = await request(app)
        .get("/posts/post")
        .query({ sender: "NonExistentOwner" })
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // GET /:id - Get post by ID
  describe("GET /posts/:id", () => {
    test("Should get post by id", async () => {
      const response = await request(app).get(`/posts/${postId}`).set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe(testPost.title);
      expect(response.body.content).toBe(testPost.content);
    });

    test("Should return 404 for non-existent post id", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/posts/${fakeId}`).set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(404);
    });

    test("Should return 400 for invalid post id format", async () => {
      const response = await request(app).get("/posts/invalidid").set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(400);
    });
  });

  // PUT /:id - Update post
  describe("PUT /posts/:id", () => {
    test("Should update post successfully", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated Content",
      };

      const response = await request(app)
        .put(`/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.content).toBe(updateData.content);
      // Owner should remain unchanged
      expect(response.body.owner).toBe(testPost.owner);
    });

    test("Should fail to update non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).put(`/posts/${fakeId}`).set("Authorization", `Bearer ${accessToken}`).send({
        title: "Updated Title",
      });
      expect(response.statusCode).toBe(400);
    });
  });

  // Cleanup test
  test("Should clean up test data", async () => {
    await postModel.deleteMany({});
    await userModel.deleteMany({});
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});
