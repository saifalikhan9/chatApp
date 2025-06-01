import { Server } from "ws";
import type { Server as HTTPServer } from "http";
import { prisma } from "./prisma";

import { PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import jwt from "jsonwebtoken";

export function setupWebSocket(server: HTTPServer) {
  const wss = new Server({ server });

  wss.on("connection", (socket, req) => {
    // Extract the token from the query parameters
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Access denied. No token provided.",
        })
      );
      socket.close(1008, "Access denied. No token provided."); // Close the connection
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "");
      console.log("🔑 Authenticated user:", decoded);
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      socket.close(1008, "Unauthorized"); // Close the connection
      return;
    }

    console.log("🔌 New client connected");

    socket.on("message", async (data) => {
      let parsed;
      try {
        parsed = JSON.parse(data.toString());
        console.log(parsed,"parsed");
        
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
            broadcast(wss, {
              type: "message:created",
              payload: message,
            });
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
            broadcast(wss, {
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
            await prisma.message.delete({ where: { id } });
            broadcast(wss, {
              type: "message:deleted",
              payload: { id },
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

    socket.on("close", () => console.log("❌ Client disconnected"));
  });
}

// Broadcast helper
function broadcast(wss: Server, message: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
