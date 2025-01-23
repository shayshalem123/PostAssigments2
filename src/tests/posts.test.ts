// import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import mongoose from "mongoose";
import request from "supertest";
import postModel from "../models/posts.model";

import initApp from "../server";
import { Express } from "express";

var app: Express;


// import userModel, { IUser } from "../models/users.model";

// type User = IUser & { token?: string };
// const testUser: User = {
//   email: "test@user.com",
//   password: "testpassword",
// }

beforeAll(async () => {
  // console.log("beforeAll");
  app = await initApp();

  await postModel.deleteMany({}); // Clear the posts collection before tests

  // await userModel.deleteMany();
  // await request(app).post("/auth/register").send(testUser);
  // const res = await request(app).post("/auth/login").send(testUser);
  // testUser.token = res.body.token;
  // testUser._id = res.body._id;
  // expect(testUser.token).toBeDefined();
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
    owner: "TestOwner"
  };

  // GET / - Get all posts
  describe("GET /posts", () => {
    test("Should get empty posts array initially", async () => {
      const response = await request(app).get("/posts");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("Should get all posts after creating some", async () => {
      // Create test posts first
      await request(app).post("/posts").send(testPost);
      await request(app).post("/posts").send({...testPost, title: "Second Post"});
      
      const response = await request(app).get("/posts");
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
    });

    // test("Should filter posts by sender", async () => {
    //   const response = await request(app).get("/posts?sender=TestOwner");
    //   expect(response.statusCode).toBe(200);
    //   expect(Array.isArray(response.body)).toBeTruthy();
    //   expect(response.body.every((post: { owner: string }) => post.owner === "TestOwner")).toBeTruthy();
    // });

    test("Should return empty array for non-existent sender", async () => {
      const response = await request(app).get("/posts?sender=NonExistentOwner");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // POST / - Create post
  describe("POST /posts", () => {
    test("Should create new post successfully", async () => {
      const response = await request(app).post("/posts").send(testPost);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.title).toBe(testPost.title);
      expect(response.body.content).toBe(testPost.content);
      expect(response.body.owner).toBe(testPost.owner);
      expect(response.body._id).toBeDefined();
      
      postId = response.body._id;
    });

    test("Should fail to create post without title", async () => {
      const { title, ...postWithoutTitle } = testPost;
      const response = await request(app).post("/posts").send(postWithoutTitle);
      expect(response.statusCode).toBe(400);
    });

    test("Should fail to create post without owner", async () => {
      const { owner, ...postWithoutOwner } = testPost;
      const response = await request(app).post("/posts").send(postWithoutOwner);
      expect(response.statusCode).toBe(400);
    });
  });

  // GET /post - Get posts by sender
  describe("GET /posts/post", () => {
    // test("Should get posts by sender using /post endpoint", async () => {
    //   const response = await request(app).get("/posts/post").query({ sender: "TestOwner" });
    //   expect(response.statusCode).toBe(200);
    //   expect(Array.isArray(response.body)).toBeTruthy();
    //   expect(response.body.every((post: { owner: string }) => post.owner === "TestOwner")).toBeTruthy();
    // });

    test("Should return empty array for non-existent sender using /post endpoint", async () => {
      const response = await request(app).get("/posts/post").query({ sender: "NonExistentOwner" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // GET /:id - Get post by ID
  describe("GET /posts/:id", () => {
    test("Should get post by id", async () => {
      const response = await request(app).get(`/posts/${postId}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe(testPost.title);
      expect(response.body.content).toBe(testPost.content);
    });

    test("Should return 404 for non-existent post id", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/posts/${fakeId}`);
      expect(response.statusCode).toBe(404);
    });

    test("Should return 400 for invalid post id format", async () => {
      const response = await request(app).get("/posts/invalidid");
      expect(response.statusCode).toBe(400);
    });
  });

  // PUT /:id - Update post
  describe("PUT /posts/:id", () => {
    test("Should update post successfully", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated Content"
      };
      
      const response = await request(app).put(`/posts/${postId}`).send(updateData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.content).toBe(updateData.content);
      // Owner should remain unchanged
      expect(response.body.owner).toBe(testPost.owner);
    });

    test("Should fail to update non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).put(`/posts/${fakeId}`).send({
        title: "Updated Title"
      });
      expect(response.statusCode).toBe(404);
    });

    test("Should fail to update with invalid id format", async () => {
      const response = await request(app).put("/posts/invalidid").send({
        title: "Updated Title"
      });
      expect(response.statusCode).toBe(400);
    });

    test("Should not allow updating to empty title", async () => {
      const response = await request(app).put(`/posts/${postId}`).send({
        title: ""
      });
      expect(response.statusCode).toBe(400);
    });
  });

  // Cleanup test
  test("Should clean up test data", async () => {
    await postModel.deleteMany({});
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});