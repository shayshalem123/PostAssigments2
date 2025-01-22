import express from "express";

import postsController from "../controllers/posts.controller";

const router = express.Router();

router.get("/", (req, res) => {
  if (req.query.sender) {
    postsController.getAllPostsBySender(req, res);
  } else {
    postsController.getAll(req, res);
  }
});

router.post("/", postsController.create.bind(postsController));

router.put("/:id", postsController.update.bind(postsController));

router.get("/post", postsController.getAllPostsBySender.bind(postsController));

router.get("/:id", postsController.getById.bind(postsController));

export default router;
