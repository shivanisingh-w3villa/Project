//authController.js

import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "admin";

export const signup = async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role based on admin secret key
    let role = "user";
    if (adminSecret && adminSecret === ADMIN_SECRET_KEY) {
      role = "admin";
    }

    // normal signups create a regular user; providing the correct adminSecret
    // during signup will create an admin account.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
      role: role,
    });

    res.status(200).json({ message: "Signup successful! You can now login.", role });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// helper route to fetch information about the currently authenticated user
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "name email role");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // include role inside the JWT so frontend can make decisions
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
