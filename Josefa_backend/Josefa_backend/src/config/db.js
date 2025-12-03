import mongoose from "mongoose";

export const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB conectado");
  } catch (err) {
    console.error("Error Mongo:", err.message);
    process.exit(1);
  }
};
