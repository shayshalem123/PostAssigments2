import mongoose from "mongoose";

export interface IComment {
  content: string;
  owner: string;
  postId: string;
}

const commentSchema = new mongoose.Schema<IComment>({
  content: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
});

const commentModel = mongoose.model<IComment>("comments", commentSchema);

export default commentModel;
