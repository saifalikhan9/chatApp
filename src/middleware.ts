import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, CustomError } from "./lib/types";
import { config } from "./lib/config";
import { User } from "@prisma/client";

export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies.accessToken as string | null;

  if (!token) {
    const error: CustomError = new Error("No Token Provided");
    error.statusCode = 404;
    throw error;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET_ACCESS_TOKEN) as {id:string , email:string}

    
    if (!decoded) {
      const error: CustomError = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }
   console.log(decoded,"decoded");
   

    req.userId = decoded.id;

    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
}
