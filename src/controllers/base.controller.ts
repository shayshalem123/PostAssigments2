import { Request, Response } from "express";
import { Model } from "mongoose";

class BaseController<T> {
  model: Model<T>;
  constructor(model: any) {
    this.model = model;
  }

  async getAll(req: Request, res: Response) {
    const filter = req.query.owner;
    try {
      if (filter) {
        const item = await this.model.find({ owner: filter });
        res.send(item);
      } else {
        const items = await this.model.find();
        res.send(items);
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;

    try {
      const item = await this.model.findById(id);
      if (item != null) {
        res.send(item);
      } else {
        res.status(404).send("not found");
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async create(req: Request, res: Response) {
    const body = req.body;
    try {
      const item = await this.model.create(body);
      res.status(201).send(item);
    } catch (error) {
      console.log({ error });
      res.status(400).send(error);
    }
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    try {
      const item = await this.model.findById(id);
      if (!item) {
        res.status(404).send("not found");
      }

      // Type guard to check if item has owner property
      const hasOwner = (doc: any): doc is { owner: string } => {
        return doc && typeof doc.owner === 'string';
      };

      if (!hasOwner(item)) {
        res.status(400).send("item does not have owner field");
        return
      }

      // Type guard for req.user
      const hasUser = (req: Request): req is Request & { user: { userId: string } } => {
        return Boolean(req.params.userId);
      };

      if (!hasUser(req)) {
        res.status(401).send("unauthorized");
        return
      }

      if (item?.owner !== req.params.userId) {
        res.status(403).send("forbidden");
        return
      }

      await this.model.findByIdAndDelete(id);
      res.status(200).send("deleted");
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id;

      const doc = await this.model
        .findOneAndUpdate({ _id: id }, req.body, { returnDocument: "after" })
        .lean();

      if (!doc) {
        throw new Error("cannot update doc that does not exist");
      }

      res.send(doc);
    } catch (error) {
      res.status(400).send(error);
    }
  }
}
export default BaseController;
