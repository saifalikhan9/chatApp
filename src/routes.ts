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
  getRecentChats
} from "./controller";
import { verifyToken } from "./middleware";

const router = Router();
router.post("/signup", createUser);
router.post("/login", login);
router.get("/getUsers", verifyToken, getUsers);
router.get("/logout", verifyToken, logout);
router.post("/addFriends", verifyToken, addFriend);
router.get("/getFriends", verifyToken, getFriends);
router.delete("/deleteFriend", verifyToken, deleteFriend);
router.get("/getMessages/:senderId", verifyToken, getMessages);
router.get("/recentChats/:userId", verifyToken, getRecentChats);

export default router;
