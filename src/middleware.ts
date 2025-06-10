import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./lib/types";
import { config } from "./lib/config";

export function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Expecting header to be like: "Bearer <token>"
  const cookieHeader = req.headers.cookie!;

  // Parse the cookie string into an object
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, value] = c.split("=");
      return [key, value];
    })
  );
  const { accessToken } = cookies;

  if (!accessToken) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(accessToken, config.JWT_SECRET_ACCESS_TOKEN) as {
      userId: string;
    };

    if (!decoded) {
      res.json({ type: "error", message: "Unauthorized ", staus: 404 });
      return;
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
    console.error(error);
    return;
  }
}
