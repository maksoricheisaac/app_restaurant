"use server";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";

export const getCategories = actionClient.action(async () => {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { name: "asc" },
  });
  return { categories };
}); 