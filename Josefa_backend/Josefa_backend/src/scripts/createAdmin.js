// src/scripts/createAdmin.js
import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    const email = "admin@tokyonoodles.cl";
    const password = "admintokyo";

    const exists = await User.findOne({ email });
    if (exists) {
      console.log("El admin ya existe:", exists.email);
      process.exit(0);
    }

    // OJO: no hashear aquí; lo hace el pre('save')
    const admin = await User.create({
      name: "Administrador",
      email,
      password,
      role: "admin",
    });

    console.log("Admin creado correctamente:", { id: admin._id, email: admin.email, role: admin.role });
    process.exit(0);
  } catch (err) {
    console.error("Error creando admin:", err.message);
    process.exit(1);
  }
})();
