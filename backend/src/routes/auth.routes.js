import { Router } from "express";
import { register, login,newpassword } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/newpassword", newpassword);

export default router;
