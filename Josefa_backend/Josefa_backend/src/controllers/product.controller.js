// src/controllers/product.controller.js
import mongoose from "mongoose";
import Product from "../models/product.model.js";

// GET /api/products
export const listProducts = async (req, res) => {
  try {
    const items = await Product.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("listProducts error:", err);
    res.status(500).json({ message: "Error al listar productos" });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }
    const item = await Product.findById(id);
    if (!item) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(item);
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ message: "Error al obtener producto" });
  }
};

// POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    const created = await Product.create({
      name,
      description: description || "",
      price,
      image: image || "",
      category,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Error al crear producto" });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }
    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(updated);
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ message: "Error al actualizar producto" });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ ok: true, message: "Producto eliminado" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
};
