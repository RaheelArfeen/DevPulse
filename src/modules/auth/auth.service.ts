import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/index";
import { pool } from "../../db/index";
import type { IUser } from "./auth.interface";

const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email],
  );
  return result;
};

const createUserInDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;
  const hashed = await bcrypt.hash(password, config.bcrypt_salt_rounds);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashed, role],
  );
  return result;
};

const generateToken = (user: any) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, config.jwt_secret, {
    expiresIn: config.jwt_expires_in,
  } as jwt.SignOptions);
};

export const authService = {
  findUserByEmail,
  createUserInDB,
  generateToken,
};
