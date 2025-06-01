import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./types";

export function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.header("Authorization");

  // Expecting header to be like: "Bearer <token>"
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "") as {
      userId: string;
    };
    if (!decoded) {
      res.json({ type: "error", message: "Unauthorized ", staus: 404 });
      return
    }

    req.userId = decoded.userId;
    next();
    
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
    console.error(error);
    return
    
  }
}
