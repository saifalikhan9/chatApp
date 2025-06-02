import { Server, WebSocket } from "ws";
import type { Server as HTTPServer } from "http";
import { prisma } from "./prisma";
import jwt from "jsonwebtoken";
import { PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";

// Map to store userId -> socket
const userSockets = new Map<number, WebSocket>();

export function setupWebSocket(server: HTTPServer) {
  const wss = new Server({ server });

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Access denied. No token provided.",
        })
      );
      socket.close(1008, "Access denied. No token provided.");
      return;
    }

    let userId: number;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "") as { userId: number };
      userId = decoded.userId;
      userSockets.set(userId, socket);
      console.log("🔑 Authenticated user:", userId);
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      socket.close(1008, "Unauthorized");
      return;
    }

    console.log("🔌 New client connected");

    socket.on("message", async (data) => {
      let parsed;
      try {
        parsed = JSON.parse(data.toString());
        console.log(parsed, "parsed");
      } catch {
        return socket.send(
          JSON.stringify({
            type: "error",
            message: "Invalid JSON format",
          })
        );
      }

      switch (parsed.type) {
        case "message:create": {
          try {
            const { text, senderId, receiverId } = parsed.payload;
            const message = await prisma.message.create({
              data: { text, senderId, receiverId },
            });

            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket && receiverSocket.readyState === receiverSocket.OPEN) {
              receiverSocket.send(JSON.stringify({ type: "message:created", payload: message }));
            }

            const senderSocket = userSockets.get(senderId);
            if (
              senderSocket &&
              senderSocket.readyState === senderSocket.OPEN &&
              senderId !== receiverId
            ) {
              senderSocket.send(JSON.stringify({ type: "message:created", payload: message }));
            }
          } catch (err) {
            console.error("💥 Create error:", err);
            const msg =
              err instanceof PrismaClientUnknownRequestError
                ? "Database request error"
                : "Failed to create message";
            socket.send(JSON.stringify({ type: "error", message: msg }));
          }
          break;
        }

        case "message:update": {
          try {
            const { id, newText } = parsed.payload;
            const updated = await prisma.message.update({
              where: { id },
              data: { text: newText },
            });

            // Optionally: Notify both sender and receiver
            broadcastToInvolved(updated.senderId, updated.receiverId, {
              type: "message:updated",
              payload: updated,
            });
          } catch (err) {
            console.error("💥 Update error:", err);
            const msg =
              err instanceof PrismaClientUnknownRequestError
                ? "Database request error"
                : "Failed to update message";
            socket.send(JSON.stringify({ type: "error", message: msg }));
          }
          break;
        }

        case "message:delete": {
          try {
            const { id } = parsed.payload;
            const deleted = await prisma.message.delete({ where: { id } });

            broadcastToInvolved(deleted.senderId, deleted.receiverId, {
              type: "message:deleted",
              payload: deleted,
            });
          } catch (err) {
            console.error("💥 Delete error:", err);
            const msg =
              err instanceof PrismaClientUnknownRequestError
                ? "Database request error"
                : "Failed to delete message";
            socket.send(JSON.stringify({ type: "error", message: msg }));
          }
          break;
        }

        default:
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Unknown event type",
            })
          );
      }
    });

    socket.on("close", () => {
      console.log("❌ Client disconnected");
      userSockets.delete(userId);
    });
  });
}

// Send message only to sender and receiver
function broadcastToInvolved(senderId: number, receiverId: number, message: any) {
  const receiverSocket = userSockets.get(receiverId);
  if (receiverSocket && receiverSocket.readyState === receiverSocket.OPEN) {
    receiverSocket.send(JSON.stringify(message));
  }

  const senderSocket = userSockets.get(senderId);
  if (
    senderSocket &&
    senderSocket.readyState === senderSocket.OPEN &&
    senderId !== receiverId
  ) {
    senderSocket.send(JSON.stringify(message));
  }
}
