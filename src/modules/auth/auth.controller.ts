import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { authService } from "./auth.service";

const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required!",
      });
    }

    if (role && role !== "contributor" && role !== "maintainer") {
      return res.status(400).json({
        success: false,
        message: "Role must be contributor or maintainer!",
      });
    }

    const existing = await authService.findUserByEmail(email);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered!",
      });
    }

    const result = await authService.createUserInDB(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required!",
      });
    }

    const userData = await authService.findUserByEmail(email);
    if (userData.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    const user = userData.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    const token = authService.generateToken(user);
    delete user.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, user },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  signup,
  login,
};
