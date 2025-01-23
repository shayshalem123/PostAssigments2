import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import commentModel from "../models/comment.model";
import initApp from "../server";
import userModel from "../models/user.model";
import jwt from "jsonwebtoken";

var app: Express;
let authToken: string;
let testUser: any;

describe("Comments Endpoints", () => {
  beforeAll(async () => {
    app = await initApp();
    await commentModel.deleteMany({});
    await userModel.deleteMany({});

    // Create a test user and get auth token
    const userResponse = await request(app).post("/users/register").send({
      email: "test@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/users/login").send({
      email: "test@example.com",
      password: "password123",
    });

    authToken = loginResponse.body.accessToken;
    testUser = await userModel.findOne({ email: "test@example.com" });
  });

  afterAll(async () => {
    // Disconnect after tests
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear the comments collection before each test
    await commentModel.deleteMany({});
  });

  const sampleComment = {
    content: "Test comment",
    owner: "", // Will be set in beforeEach
    postId: "post123",
  };

  // Update sample comment before each test
  beforeEach(() => {
    sampleComment.owner = testUser._id.toString();
  });

  describe("POST /comments", () => {
    it("should create a new comment with auth token", async () => {
      const response = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(sampleComment);

      expect(response.status).toBe(201);
      expect(response.body.content).toBe(sampleComment.content);
      expect(response.body.owner).toBe(sampleComment.owner);
      expect(response.body.postId).toBe(sampleComment.postId);
    });

    it("should fail to create comment without auth token", async () => {
      const response = await request(app).post("/comments").send(sampleComment);

      expect(response.status).toBe(401);
    });

    it("should fail to create comment without required fields", async () => {
      const response = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should fail to create comment with empty content", async () => {
      const response = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...sampleComment,
          content: "",
        });

      expect(response.status).toBe(400);
    });

    it("should fail to create comment with empty owner", async () => {
      const response = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...sampleComment,
          owner: "",
        });

      expect(response.status).toBe(400);
    });

    it("should fail to create comment with empty postId", async () => {
      const response = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...sampleComment,
          postId: "",
        });

      expect(response.status).toBe(400);
    });
  });

  // describe("GET /comments", () => {
  //   it("should get all comments", async () => {
  //     // Create test comments
  //     await commentModel.create(sampleComment);
  //     await commentModel.create({
  //       ...sampleComment,
  //       content: "Another comment",
  //     });

  //     const response = await request(app)
  //       .get("/comments")
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveLength(2);
  //   });

  //   it("should return empty array when no comments exist", async () => {
  //     const response = await request(app)
  //       .get("/comments")
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toEqual([]);
  //   });

  //   it("should return comments in correct format", async () => {
  //     const comment = await commentModel.create(sampleComment);

  //     const response = await request(app)
  //       .get("/comments")
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body[0]).toEqual(
  //       expect.objectContaining({
  //         _id: expect.any(String),
  //         content: sampleComment.content,
  //         owner: sampleComment.owner,
  //         postId: sampleComment.postId,
  //         __v: expect.any(Number),
  //       })
  //     );
  //   });
  // });

  // describe("GET /comments/:id", () => {
  //   it("should get comment by id", async () => {
  //     const comment = await commentModel.create(sampleComment);

  //     const response = await request(app)
  //       .get(`/comments/${comment._id}`)
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body.content).toBe(sampleComment.content);
  //   });

  //   it("should return 404 for non-existent comment", async () => {
  //     const response = await request(app)
  //       .get(`/comments/${new mongoose.Types.ObjectId()}`)
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(404);
  //   });

  //   it("should return 400 for invalid ObjectId format", async () => {
  //     const response = await request(app)
  //       .get("/comments/invalid-id")
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(400);
  //   });

  //   it("should return complete comment data", async () => {
  //     const comment = await commentModel.create(sampleComment);

  //     const response = await request(app)
  //       .get(`/comments/${comment._id}`)
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toEqual(
  //       expect.objectContaining({
  //         _id: expect.any(String),
  //         content: sampleComment.content,
  //         owner: sampleComment.owner,
  //         postId: sampleComment.postId,
  //         __v: expect.any(Number),
  //       })
  //     );
  //   });
  // });

  // describe("GET /comments/post", () => {
  //   it("should get all comments for a specific post", async () => {
  //     // Create comments for different posts
  //     await commentModel.create(sampleComment);
  //     await commentModel.create({
  //       ...sampleComment,
  //       content: "Another comment for same post",
  //     });
  //     await commentModel.create({
  //       ...sampleComment,
  //       postId: "different-post",
  //       content: "Comment for different post",
  //     });

  //     const response = await request(app)
  //       .get("/comments/post")
  //       .query({ postId: sampleComment.postId })
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveLength(2);
  //     expect(
  //       response.body.every(
  //         (comment: any) => comment.postId === sampleComment.postId
  //       )
  //     ).toBe(true);
  //   });

  //   it("should return empty array when no comments exist for postId", async () => {
  //     const response = await request(app)
  //       .get("/comments/post")
  //       .query({ postId: "non-existent-post" })
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toEqual([]);
  //   });

  //   it("should fail when no postId is provided", async () => {
  //     const response = await request(app)
  //       .get("/comments/post")
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(400);
  //   });

  //   it("should return comments in creation order", async () => {
  //     // Create comments with different dates
  //     const firstComment = await commentModel.create({
  //       ...sampleComment,
  //       content: "First comment",
  //       createdAt: new Date(Date.now() - 1000),
  //     });

  //     const secondComment = await commentModel.create({
  //       ...sampleComment,
  //       content: "Second comment",
  //       createdAt: new Date(),
  //     });

  //     const response = await request(app)
  //       .get("/comments/post")
  //       .query({ postId: sampleComment.postId })
  //       .set("Authorization", `Bearer ${authToken}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveLength(2);
  //     expect(response.body[1].content).toBe("Second comment");
  //     expect(response.body[0].content).toBe("First comment");
  //   });
  // });

  describe("PUT /comments/:id", () => {
    it("should update own comment", async () => {
      const comment = await commentModel.create(sampleComment);
      const updatedContent = "Updated content";

      const response = await request(app)
        .put(`/comments/${comment._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: updatedContent });

      expect(response.status).toBe(200);
      const updatedComment = await commentModel.findById(comment._id);
      expect(updatedComment?.content).toBe(updatedContent);
    });

    it("should fail to update another user's comment", async () => {
      // Create a comment with a different owner
      const comment = await commentModel.create({
        ...sampleComment,
        owner: new mongoose.Types.ObjectId().toString(),
      });

      const response = await request(app)
        .put(`/comments/${comment._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Updated content" });

      expect(response.status).toBe(403);
    }, 100000);

    it("should return 400 when updating non-existent comment", async () => {
      const response = await request(app)
        .put(`/comments/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Updated content" });

      expect(response.status).toBe(400);
    });

    it("should fail with invalid ObjectId format", async () => {
      const response = await request(app)
        .put("/comments/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Updated content" });

      expect(response.status).toBe(400);
    });

    it("should handle field updates correctly", async () => {
      const comment = await commentModel.create(sampleComment);
      const updates = {
        content: "Updated content 2",
        owner: "new-owner",
        postId: "new-post-id",
      };

      const response = await request(app)
        .put(`/comments/${comment._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updates);

      const updatedComment = await commentModel.findById(comment._id);
      expect(response.status).toBe(200);
      expect(updatedComment?.content).toBe(updates.content);
      expect(updatedComment?.owner).toBe(updates.owner);
      expect(updatedComment?.postId).toBe(updates.postId);
    });
  });

  describe("DELETE /comments/:id", () => {
    it("should delete own comment", async () => {
      const comment = await commentModel.create(sampleComment);

      const response = await request(app)
        .delete(`/comments/${comment._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify comment was deleted
      const deletedComment = await commentModel.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    it("should fail to delete another user's comment", async () => {
      const comment = await commentModel.create({
        ...sampleComment,
        owner: new mongoose.Types.ObjectId().toString(),
      });

      const response = await request(app)
        .delete(`/comments/${comment._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });

    it("should fail with invalid ObjectId format", async () => {
      const response = await request(app)
        .delete("/comments/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("should delete all comments for a specific post", async () => {
      // Create multiple comments for the same post
      await commentModel.create([
        sampleComment,
        { ...sampleComment, content: "Comment 2" },
        { ...sampleComment, content: "Comment 3" },
      ]);

      const comments = await commentModel.find({
        postId: sampleComment.postId,
      });
      expect(comments).toHaveLength(3);

      // Delete each comment
      for (const comment of comments) {
        const response = await request(app)
          .delete(`/comments/${comment._id}`)
          .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
      }

      // Verify all comments are deleted
      const remainingComments = await commentModel.find({
        postId: sampleComment.postId,
      });
      expect(remainingComments).toHaveLength(0);
    }, 100000);
  });

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      // Force disconnect the database
      await mongoose.connection.close();

      const response = await request(app)
        .get("/comments")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);

      // Reconnect for other tests
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/test"
      );
    });
  });
});
