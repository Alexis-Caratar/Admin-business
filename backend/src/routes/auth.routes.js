import { Router } from "express";
import { login, newpassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// /register deshabilitado: no se usa y permitía crear usuarios eligiendo el rol
router.post("/login", login);
router.post("/newpassword", authenticate, newpassword);

export default router;
