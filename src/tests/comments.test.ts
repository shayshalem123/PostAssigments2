import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import commentModel from "../models/comment.model";
import initApp from "../server";


var app: Express;


describe("Comments Endpoints", () => {
  beforeAll(async () => {
    app = await initApp();

    await commentModel.deleteMany({});
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
    owner: "user123",
    postId: "post123"
  };

  describe("POST /comments", () => {
    it("should create a new comment", async () => {
      const response = await request(app)
        .post("/comments")
        .send(sampleComment);

      expect(response.status).toBe(201);
      expect(response.body.content).toBe(sampleComment.content);
      expect(response.body.owner).toBe(sampleComment.owner);
      expect(response.body.postId).toBe(sampleComment.postId);
    });

    it("should fail to create comment without required fields", async () => {
      const response = await request(app)
        .post("/comments")
        .send({});

      expect(response.status).toBe(400);
    });

    it("should fail to create comment with empty content", async () => {
      const response = await request(app)
        .post("/comments")
        .send({
          ...sampleComment,
          content: ""
        });

      expect(response.status).toBe(400);
    });

    it("should fail to create comment with empty owner", async () => {
      const response = await request(app)
        .post("/comments")
        .send({
          ...sampleComment,
          owner: ""
        });

      expect(response.status).toBe(400);
    });

    it("should fail to create comment with empty postId", async () => {
      const response = await request(app)
        .post("/comments")
        .send({
          ...sampleComment,
          postId: ""
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /comments", () => {
    it("should get all comments", async () => {
      // Create test comments
      await commentModel.create(sampleComment);
      await commentModel.create({
        ...sampleComment,
        content: "Another comment"
      });

      const response = await request(app).get("/comments");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it("should return empty array when no comments exist", async () => {
      const response = await request(app).get("/comments");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return comments in correct format", async () => {
      const comment = await commentModel.create(sampleComment);

      const response = await request(app).get("/comments");

      expect(response.status).toBe(200);
      expect(response.body[0]).toEqual(expect.objectContaining({
        _id: expect.any(String),
        content: sampleComment.content,
        owner: sampleComment.owner,
        postId: sampleComment.postId,
        __v: expect.any(Number)
      }));
    });
  });

  describe("GET /comments/:id", () => {
    it("should get comment by id", async () => {
      const comment = await commentModel.create(sampleComment);

      const response = await request(app)
        .get(`/comments/${comment._id}`);

      expect(response.status).toBe(200);
      expect(response.body.content).toBe(sampleComment.content);
    });

    it("should return 404 for non-existent comment", async () => {
      const response = await request(app)
        .get(`/comments/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const response = await request(app)
        .get("/comments/invalid-id");

      expect(response.status).toBe(400);
    });

    it("should return complete comment data", async () => {
      const comment = await commentModel.create(sampleComment);

      const response = await request(app)
        .get(`/comments/${comment._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        _id: expect.any(String),
        content: sampleComment.content,
        owner: sampleComment.owner,
        postId: sampleComment.postId,
        __v: expect.any(Number)
      }));
    });
  });

  describe("GET /comments/post", () => {
    it("should get all comments for a specific post", async () => {
      // Create comments for different posts
      await commentModel.create(sampleComment);
      await commentModel.create({
        ...sampleComment,
        content: "Another comment for same post"
      });
      await commentModel.create({
        ...sampleComment,
        postId: "different-post",
        content: "Comment for different post"
      });

      const response = await request(app)
        .get("/comments/post")
        .query({ postId: sampleComment.postId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((comment: any) => comment.postId === sampleComment.postId)).toBe(true);
    });

    it("should return empty array when no comments exist for postId", async () => {
      const response = await request(app)
        .get("/comments/post")
        .query({ postId: "non-existent-post" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should fail when no postId is provided", async () => {
      const response = await request(app)
        .get("/comments/post");

      expect(response.status).toBe(400);
    });

    it("should return comments in creation order", async () => {
      // Create comments with different dates
      const firstComment = await commentModel.create({
        ...sampleComment,
        content: "First comment",
        createdAt: new Date(Date.now() - 1000)
      });
      
      const secondComment = await commentModel.create({
        ...sampleComment,
        content: "Second comment",
        createdAt: new Date()
      });

      const response = await request(app)
        .get("/comments/post")
        .query({ postId: sampleComment.postId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[1].content).toBe("Second comment");
      expect(response.body[0].content).toBe("First comment");
    });
  });

  describe("PUT /comments/:id", () => {
    it("should update a comment", async () => {
      const comment = await commentModel.create(sampleComment);
      const updatedContent = "Updated content";

      const response = await request(app)
        .put(`/comments/${comment._id}`)
        .send({ content: updatedContent });

      const updatedComment = await commentModel.findById(comment._id);
      expect(response.status).toBe(200);
      expect(updatedComment?.content).toBe(updatedContent);
    });

    it("should return 400 when updating non-existent comment", async () => {
      const response = await request(app)
        .put(`/comments/${new mongoose.Types.ObjectId()}`)
        .send({ content: "Updated content" });

      expect(response.status).toBe(400);
    });

    it("should fail with invalid ObjectId format", async () => {
      const response = await request(app)
        .put("/comments/invalid-id")
        .send({ content: "Updated content" });

      expect(response.status).toBe(400);
    });

    it("should handle field updates correctly", async () => {
      const comment = await commentModel.create(sampleComment);
      const updates = {
        content: "Updated content 2",
        owner: "new-owner",
        postId: "new-post-id"
      };

      const response = await request(app)
        .put(`/comments/${comment._id}`)
        .send(updates);

      const updatedComment = await commentModel.findById(comment._id);
      expect(response.status).toBe(200);
      expect(updatedComment?.content).toBe(updates.content);
      expect(updatedComment?.owner).toBe(updates.owner);
      expect(updatedComment?.postId).toBe(updates.postId);
    });
  });

  describe("DELETE /comments/:id", () => {
    it("should delete a comment", async () => {
      const comment = await commentModel.create(sampleComment);

      const response = await request(app)
        .delete(`/comments/${comment._id}`);

      expect(response.status).toBe(200);

      // Verify comment was deleted
      const deletedComment = await commentModel.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    it("should fail with invalid ObjectId format", async () => {
      const response = await request(app)
        .delete("/comments/invalid-id");

      expect(response.status).toBe(400);
    });

    it("should delete all comments for a specific post", async () => {
      // Create multiple comments for the same post
      await commentModel.create([
        sampleComment,
        { ...sampleComment, content: "Comment 2" },
        { ...sampleComment, content: "Comment 3" }
      ]);

      const comments = await commentModel.find({ postId: sampleComment.postId });
      expect(comments).toHaveLength(3);

      // Delete each comment
      for (const comment of comments) {
        const response = await request(app)
          .delete(`/comments/${comment._id}`);
        expect(response.status).toBe(200);
      }

      // Verify all comments are deleted
      const remainingComments = await commentModel.find({ postId: sampleComment.postId });
      expect(remainingComments).toHaveLength(0);
    });
  });

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      // Force disconnect the database
      await mongoose.connection.close();

      const response = await request(app)
        .get("/comments");

      expect(response.status).toBe(400);

      // Reconnect for other tests
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test");
    });
  });
});
