import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";

import postsRoute from './routes/posts.route'
import commentsRoute from "./routes/comments.route";
import usersRoute from "./routes/users.route";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");

  next();
});

app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/users", usersRoute)

const db = mongoose.connection;

db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const initApp = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in .env file");
  }

  await mongoose.connect(process.env.MONGO_URI);

  return app;
};

export default initApp;
