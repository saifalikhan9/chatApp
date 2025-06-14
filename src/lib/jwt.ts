import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "./config";
import { User } from "@prisma/client";

export const generateRefreshToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.JWT_SECRET_REFRESH_TOKEN,
    { expiresIn: config.REFRESH_TOKEN_EXPIRY }
  );
};

export const generateAccessToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.JWT_SECRET_ACCESS_TOKEN,
    { expiresIn: config.ACCESS_TOKEN_EXPIRY }
  );
};

export const verifyRefreshToken = (token: string): {id:string,email:string}  => {
  const decoded = jwt.verify(
    token,
    config.JWT_SECRET_REFRESH_TOKEN
  ) as JwtPayload;

  console.log(decoded,"from veryfy token");
  

  return  {id:decoded.id, email:decoded.email} ;
};
