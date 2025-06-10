import { PrismaClient } from "@prisma/client";
import { config } from "./lib/config";


declare global {
  // allow global `var` declaration for Prisma
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// prevent multiple instances in dev
export const prisma = global.prisma ?? new PrismaClient();

if (config.NODE_ENV === "development") global.prisma = prisma;
