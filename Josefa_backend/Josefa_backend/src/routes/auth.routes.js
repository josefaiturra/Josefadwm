import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me); // <-- nada de "auth" aquí

export default router;
