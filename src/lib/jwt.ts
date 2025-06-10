import jwt from "jsonwebtoken";
import { config } from "./config";

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.JWT_SECRET_REFRESH_TOKEN,
    {
      expiresIn: config.REFRESH_TOKEN_EXPIRY ,
      subject: "accessApi",
    }
  );
};

export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.JWT_SECRET_ACCESS_TOKEN,
    {
      expiresIn: config.ACCESS_TOKEN_EXPIRY ,
      subject: "accessApi",
    }
  );
};
