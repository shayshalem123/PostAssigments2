import express from "express";

import commentsController from "../controllers/comments.controller";

const router = express.Router();

router.get("/", commentsController.getAll.bind(commentsController));

router.post("/", commentsController.create.bind(commentsController));

router.get("/post", commentsController.getAllCommentsByPostId.bind(commentsController));

router.get("/:id", commentsController.getById.bind(commentsController));

router.delete("/:id", commentsController.deleteItem.bind(commentsController));

router.put("/:id", commentsController.update.bind(commentsController));

export default router;
