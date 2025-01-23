import { Request, Response } from "express";

import commentModel, { IComment } from "../models/comment.model";
import BaseController from "./base.controller";

class CommentsController extends BaseController<IComment> {
  constructor() {
    super(commentModel);
  }

  async getAllCommentsByPostId(req: Request, res: Response): Promise<void> {
    try {
      if (!req.query.postId) {
         res.status(400).send("postId is required");
         return
      }

      const comments = await this.model.find({ postId: req.query.postId });
      res.send(comments);
    } catch (error) {
      res.status(400).send(error);
    }
  }
}

export default new CommentsController();
