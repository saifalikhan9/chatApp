import { Router } from "express";
import {
  addFriend,
  createUser,
  deleteFriend,
  getFriends,
  getMessages,
  getUsers,
  login,
  logout,
  getRecentChats,
  generateToken,
  getUnreadMessages,
  getMe
} from "./controller";
import { verifyToken } from "./middleware";

const router = Router();
router.post("/signup", createUser);
router.post("/login", login);
router.post("/generateToken", generateToken);
router.get("/logout", verifyToken, logout);
router.get("/getMe", verifyToken, getMe);
router.get("/getUsers", verifyToken, getUsers);
router.post("/addFriends", verifyToken, addFriend);
router.get("/getFriends", verifyToken, getFriends);
router.delete("/deleteFriend", verifyToken, deleteFriend);
router.get("/getMessages/:senderId", verifyToken, getMessages);
router.get("/recentChats/:userId", verifyToken, getRecentChats);
router.get("/unreadMessages", verifyToken, getUnreadMessages);

export default router;
