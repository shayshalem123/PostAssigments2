import express from "express";

import { register, login, refresh, logout } from "../controllers/auth.controller";

const router = express.Router();


export default router;

router.post("/register", register);

router.post("/login", login);

router.post("/refresh", refresh);

router.post("/logout", logout);