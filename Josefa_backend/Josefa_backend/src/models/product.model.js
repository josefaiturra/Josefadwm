import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  description:{ type: String, required: true, trim: true },
  price:      { type: Number, required: true, min: 0 },
  image:      { type: String, default: "" },
  category:   { type: String, default: "general", trim: true }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
