// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";     // <-- AQUI
import productRoutes from "./routes/product.routes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Rutas API  (ANTES del static y del 404 /api)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);         // <-- AQUI
app.use("/api/products", productRoutes);

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend_tienda")));

// Fallback para rutas que NO son /api
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend_tienda/index.html"));
});

// 404 para /api
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 4000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Servidor listo → http://localhost:${PORT}`));
});