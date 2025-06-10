import { Request, Response } from "express";
import { AuthRequest, User } from "./lib/types";
import { decryptPassword, hashPasswordFn } from "./lib/utils";
import { prisma } from "./prisma";
import { generateAccessToken, generateRefreshToken } from "./lib/jwt";
import { config } from "./lib/config";

export async function createUser(req: Request, res: Response) {
  const { name, email, password } = req.body as Pick<
    User,
    "name" | "email" | "password"
  >;
  if (!name || !email || !password) {
    res.status(400).json({
      type: "error",
      message: "Fields are Missing",
      status: 400,
    });
    return;
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(409).json({
      type: "error",
      status: 409,
      message: "User is already Registered",
    });
    return;
  }

  const hspass = await hashPasswordFn(password);
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hspass },
    });
    const { password: _, ...userSafe } = user;
    res.status(201).json({
      type: "success",
      message: "Successfully created user",
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      // 500 Internal Server Error for unexpected errors
      type: "error",
      status: 500,
      message: "Unexpected error caught",
    });
    return;
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      // 400 Bad Request for missing fields
      type: "error",
      message: "Fields are missing",
      status: 400,
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      res.status(404).json({
        status: 404,
        type: "error",
        message: "User not found with this email",
      });
      return;
    }

    const compare = await decryptPassword(password, user?.password);
    if (!compare) {
      res.status(401).json({
        type: "error",
        message: "Incorrect Password",
        status: 401,
      });
      return;
    }
    const { password: _, ...userSafe } = user;

    const accessToken = generateAccessToken(user.id);

    const refreshToken = generateRefreshToken(user.id);

    if (!accessToken || !refreshToken) {
      res.status(500).json({
        type: "error",
        status: 500,
        message: "Unable to generate Token",
      });
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      type: "success",
      status: 200,
      message: "Logged in successfully",
      user: userSafe,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      // 500 Internal Server Error for unexpected errors
      type: "error",
      status: 500,
      message: "Unexpected error caught",
    });
    return;
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const id = req.userId as string;
    const refreshToken = req.cookies.refreshToken as string;
    console.log(refreshToken, "refreshtoken");
    if (refreshToken) {
      await prisma.user.update({ where: { id }, data: { refreshToken: "" } });
      console.log("refreshtoken deleted");
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(204).json({
      type: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: error || "internal server error",
    });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({ omit: { password: true } });

    res.status(200).json({
      // 200 OK for successful retrieval of users
      type: "success",
      status: 200,
      users,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      // 500 Internal Server Error for unexpected errors
      type: "error",
      message: "Something went wrong",
      status: 500,
    });
  }
  return;
}
export const addFriend = async (
  req: AuthRequest<{ friendEmail: string }>,
  res: Response
) => {
  const { friendEmail } = req.body;
  const userId = req.userId;
  console.log(userId, "id");

  if (!userId) {
    res.status(404).json({ error: "userId not found" });
    return;
  }

  if (!friendEmail) {
    res.status(400).json({ error: "Friend email is required" });
    return;
  }

  try {
    const friend = await prisma.user.findUnique({
      where: { email: friendEmail },
    });

    if (!friend) {
      res.status(404).json({ error: "User not found with provided email" });
      return;
    }

    if (friend.id === userId) {
      res.status(400).json({ error: "You cannot add yourself as a friend" });
      return;
    }

    const existing = await prisma.friend.findFirst({
      where: {
        userId,
        friendId: friend.id,
      },
    });

    if (existing) {
      res.status(409).json({ error: "Already friends" });
      return;
    }

    // Add friendship both ways (optional for bidirectional)
    await prisma.friend.createMany({
      data: [
        { userId, friendId: friend.id },
        { userId: friend.id, friendId: userId },
      ],
    });

    res.status(201).json({ message: "Friend added successfully" });
  } catch (error) {
    console.error("Add Friend Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getFriends = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  console.log(userId, "userid");

  try {
    const friends = await prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!friends) {
      res.json({ message: "user Not found with this name" });
      return;
    }

    res.json(friends.map((f) => f.friend));
  } catch (error) {
    console.error("Get Friends Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const deleteFriend = async (
  req: AuthRequest<{ id: string }, {}>,
  res: Response
) => {
  const userId = req.userId;
  const { id } = req.body;

  try {
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId: id },
          { userId: id, friendId: userId },
        ],
      },
    });

    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Delete Friend Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (
  req: AuthRequest<{}, { senderId: string }>,
  res: Response
) => {
  try {
    const senderId = req.params.senderId;
    const receiverId = req.userId;

    // Get messages either sent or received between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: "asc" }, // Optional: sort by time
    });
    if (!messages) {
      res.status(401).json({ message: "Messages not found" });
    }

    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
export const getRecentChats = async (
  req: AuthRequest<{ userId: string }>,
  res: Response
) => {
  const userId = req.params.userId;

  if (!userId) {
    res.status(400).json({ message: "User ID is required" });
    return;
  }

  try {
    // Step 1: Get all friend relations
    const friends = await prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Step 2: For each friend, find last message and unread count
    const recentChats = await Promise.all(
      friends.map(async (f) => {
        const friendId = f.friend.id;

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: friendId },
              { senderId: friendId, receiverId: userId },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: friendId,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          friendId,
          name: f.friend.name,
          lastMessage: lastMessage?.text ?? "No messages yet",
          timestamp: lastMessage?.createdAt ?? null,
          unreadCount,
        };
      })
    );

    res.status(200).json({
      type: "success",
      status: 200,
      data: recentChats,
    });
  } catch (error) {
    console.error("getRecentChats Error:", error);
    res.status(500).json({
      type: "error",
      status: 500,
      message: "Failed to fetch recent chats",
    });
  }
};
