// src/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const emailNorm = (email || "").trim().toLowerCase();

  const exists = await User.findOne({ email: emailNorm });
  if (exists) return res.status(409).json({ message: "Email ya registrado" });

  const user = await User.create({ name, email: emailNorm, password });
  return res.status(201).json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: (email || "").trim().toLowerCase() }).select("+password");
  if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

  return res.json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};
