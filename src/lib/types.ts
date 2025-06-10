// types.d.ts - Complete type definitions

import { NextFunction, Request } from "express";

// ===== EXISTING ENTITY TYPES =====
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  refreshToken?: string;
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
  id: string;
  userId: string;
  friendId: number;
  user?: User;
  friend?: User;
}

// ===== EXTENDED REQUEST TYPES =====
export interface AuthRequest<Body = any, Params = any, Query = any>
  extends Request<Params, any, Body, Query> {
  userId?: string;
  user?: User;
  requestId?: string;
  startTime?: number;
}

// ===== ERROR HANDLING TYPES =====
export interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  code?: number;
  errors?: any;
  isOperational?: boolean;
}

export interface ValidationError extends CustomError {
  name: 'ValidationError';
  errors: Record<string, any>;
}

export interface CastError extends CustomError {
  name: 'CastError';
  path: string;
  value: any;
}

export interface MongoError extends CustomError {
  code: 11000;
  keyPattern: Record<string, number>;
  keyValue: Record<string, any>;
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp?: string;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface NotFoundResponse {
  error: string;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== AUTH & JWT TYPES =====
export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password' | 'refreshToken'>;
  accessToken: string;
  refreshToken: string;
}

// ===== MESSAGE TYPES =====
export interface CreateMessageRequest {
  text: string;
  receiverId: number;
}

export interface MessageResponse extends ApiResponse<Message> {}

export interface MessagesResponse extends ApiResponse<Message[]> {}

// ===== FRIEND TYPES =====
export interface AddFriendRequest {
  friendId: number;
}

export interface FriendResponse extends ApiResponse<Friend> {}

export interface FriendsResponse extends ApiResponse<Friend[]> {}

// ===== WEBSOCKET TYPES =====
export interface WebSocketMessage {
  type: 'message' | 'friend_request' | 'friend_accepted' | 'user_online' | 'user_offline';
  payload: any;
  timestamp: string;
  userId?: number;
}

export interface NewMessagePayload {
  message: Message;
  receiverId: number;
}

export interface FriendRequestPayload {
  friend: Friend;
  requestType: 'sent' | 'received';
}

export interface UserStatusPayload {
  userId: number;
  status: 'online' | 'offline';
}

// ===== FILE UPLOAD TYPES =====
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// ===== VALIDATION TYPES =====
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: any[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ===== MIDDLEWARE TYPES =====
export type AsyncMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

export type ErrorMiddleware = (
  err: CustomError,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => void;

// ===== DATABASE TYPES =====
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

// ===== CONFIGURATION TYPES =====
export interface AppConfig {
  WHITELIST_ORIGIN: string | string[] | RegExp | boolean;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  DATABASE_URL: string;
  REDIS_URL?: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  [key: string]: any;
}

// ===== ENVIRONMENT TYPES =====
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      DATABASE_URL: string;
      REDIS_URL?: string;
      WHITELIST_ORIGIN: string;
    }
  }
}

// ===== EXPRESS EXTENSIONS =====
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
      requestId?: string;
      startTime?: number;
    }
    
    interface Response {
      locals: {
        user?: User;
        [key: string]: any;
      };
    }
  }
}


// ===== UTILITY TYPES =====
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type UserWithoutPassword = Omit<User, 'password'>;
export type UserWithoutSensitiveData = Omit<User, 'password' | 'refreshToken'>;

// ===== API ENDPOINT TYPES =====
export interface GetMessagesQuery {
  page?: string;
  limit?: string;
  friendId?: string;
}

export interface GetFriendsQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ===== PAGINATION TYPES =====
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}