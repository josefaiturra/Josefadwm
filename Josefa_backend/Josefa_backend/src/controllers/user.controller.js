import mongoose from "mongoose";
import User from "../models/user.model.js";

/* =========================================================
   GET /api/users (paginado + búsqueda + filtro por rol)
   Query: ?q=texto&role=user|admin&page=1&limit=10
   ========================================================= */
export const listUsers = async (req, res) => {
  try {
    const { q = "", role = "", page = 1, limit = 10 } = req.query;

    const find = {};
    if (q) {
      find.$or = [
        { name:  { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
    if (role && ["user", "admin"].includes(role)) {
      find.role = role;
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      User.find(find).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(find),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

/* =========================================================
   GET /api/users (versión simple sin paginación)
   (Deja este export si ya lo usan tus rutas antiguas)
   ========================================================= */
export const getUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

/* =========================================================
   GET /api/users/:id
   ========================================================= */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ message: "Error al obtener usuario" });
  }
};

/* =========================================================
   POST /api/users
   Body: { name, email, password, role? }
   ========================================================= */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email y password son requeridos" });
    }
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "role inválido" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email ya registrado" });

    // El hook pre('save') del modelo hashea el password
    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

/* =========================================================
   PUT /api/users/:id
   Body: { name?, email?, role?, password? }
   ========================================================= */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (email && email !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase() });
      if (taken) return res.status(409).json({ message: "Ese email ya está en uso" });
      user.email = email;
    }

    if (role) {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "role inválido" });
      }
      user.role = role;
    }

    if (name) user.name = name;

    // Si viene password, el hook del modelo lo hashea
    if (password) user.password = password;

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

/* =========================================================
   DELETE /api/users/:id
   (evita que un admin se elimine a sí mismo)
   ========================================================= */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (req.user?.id && user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
    }

    await user.deleteOne();
    res.json({ ok: true, message: "Usuario eliminado" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};