import dotenv from "dotenv";
import type ms from "ms";
dotenv.config();
export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV,
  WHITELIST_ORIGIN: ["http://192.168.1.3:5173", "http://localhost:5173"],
  Database_URL: process.env.DATABASE_URL,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN!,
  JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN!,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY as ms.StringValue,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY as ms.StringValue,
  API_KEY: process.env.OPENAI_API_KEY!,
};
