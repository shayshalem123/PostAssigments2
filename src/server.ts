import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import { authMiddleware } from "./controllers/auth.controller";

import postsRoute from "./routes/posts.route";
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

app.use("/users", usersRoute);
app.use(authMiddleware);
app.use("/posts", authMiddleware, postsRoute);
app.use("/comments", authMiddleware, commentsRoute);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Posts Assignment API Documentation",
      version: "1.0.0",
      description: "Documentation for your REST API",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

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
