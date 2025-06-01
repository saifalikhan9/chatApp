import { Request } from "express";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  text: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Friend {
  id: number;
  userId: number;
  friendId: number;
  user?: User;
  friend?: User;
}


export interface AuthRequest<
  Body = any,
  Params = any,
  Query = any
> extends Request<Params, any, Body, Query> {
  userId?: number;
}