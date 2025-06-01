import { PrismaClient } from "@prisma/client";


declare global {
  // allow global `var` declaration for Prisma
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// prevent multiple instances in dev
export const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;
