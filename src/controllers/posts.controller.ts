import { Request, Response } from "express";

import postModel, { IPost } from "../models/posts.model";
import BaseController from "./base.controller";

class PostsController extends BaseController<IPost> {
  constructor() {
    super(postModel);
  }

  async getAllPostsBySender(req: Request, res: Response) {
    try {
      const posts = await this.model.find({ owner: req.query.sender });

      res.send(posts);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      await this.model.findOneAndUpdate(req.body);

      res.send();
    } catch (error) {
      res.status(400).send(error);
    }
  }
}

export default new PostsController();
