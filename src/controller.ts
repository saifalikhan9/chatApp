import { Request, Response } from "express";
import { AuthRequest,  User } from "./types";
import { decryptPassword, hashPasswordFn } from "./utils";
import { prisma } from "./prisma";
import jwt from "jsonwebtoken";

export async function createUser(req: Request, res: Response) {
  const { name, email, password }: User = req.body;
  if (!name || !email || !password) {
    res.status(400).json({
      // 400 Bad Request for missing fields
      type: "error",
      message: "Fields are Missing",
      status: 400,
    });
    return;
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(409).json({
      // 409 Conflict for already registered user
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
      // 201 Created for successful user creation
      type: "success",
      message: "Successfully created user",
    } );
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
        // 404 Not Found for non-existent user
        status: 404,
        type: "error",
        message: "User not found with this email",
      });
      return;
    }

    const compare = await decryptPassword(password, user?.password);
    if (!compare) {
      res.status(401).json({
        // 401 Unauthorized for incorrect password
        type: "error",
        message: "Incorrect Password",
        status: 401,
      });
      return;
    }
    const { password: _, ...userSafe } = user;
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: "1h",
      }
    );
    if (!token) {
      res.status(500).json({
        // 500 Internal Server Error for token generation failure
        type: "error",
        status: 500,
        message: "Unable to generate Token",
      });
      return;
    }
    res.status(200).json({
      // 200 OK for successful login
      type: "success",
      status: 200,
      message: "Logged in successfully",
      data: userSafe,
      token,
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

export function logout(req: Request, res: Response) {
  res.status(200).json({
    // 200 OK for successful logout
    type: "success",
    status: 200,
    message: "Logged out successfully",
  });
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({ omit: { password: true } });

    res.status(200).json({
      // 200 OK for successful retrieval of users
      type: "success",
      status: 200,
      data: users,
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
  req: AuthRequest<{ id: number }, {}>,
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
  req: AuthRequest<{ userId: number }, { senderId: number }>,
  res: Response
) => {
  try {
    console.log("here");

    const senderId = Number(req.params.senderId);
    const recieversid = req.userId;
    console.log(typeof senderId, recieversid, "ids");
    const resSender = await prisma.message.findMany({
      where: { senderId: senderId },
    });
    const resReciver = await prisma.message.findMany({
      where: { receiverId: recieversid },
    });
    console.log(resSender);
    console.log(resReciver);
    res
      .status(200)
      .json({ senderMesssage: resSender, RecieverMessages: resReciver });
  } catch (error) {
    console.log(error);
  }
};
