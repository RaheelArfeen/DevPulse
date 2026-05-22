import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/index";
import { pool } from "../db/index";
import type { ROLES } from "../types/index";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
      }

      const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;

      const userData = await pool.query(
        `SELECT id, name, email, role FROM users WHERE id=$1`,
        [decoded.id],
      );

      if (userData.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found!",
        });
      }

      const user = userData.rows[0];

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission.",
        });
      }

      req.user = user;
      next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token!",
      });
    }
  };
};

export default auth;
