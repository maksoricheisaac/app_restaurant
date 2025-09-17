"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "vip"]).default("active"),
  notes: z.string().optional(),
});

const customerIdSchema = z.object({
  id: z.string().cuid("Invalid customer ID"),
});

const updateCustomerSchema = customerSchema.extend({
  id: z.string().cuid("Invalid customer ID"),
});

const getCustomersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "vip"]).optional(),
  sort: z.enum(["name", "email", "status", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const createCustomer = actionClient
  .inputSchema(customerSchema)
  .action(async ({ parsedInput }) => {
    try {
      const customer = await prisma.user.create({
        data: {
          ...parsedInput,
          role: "user",
          emailVerified: false,
          id: crypto.randomUUID(),
        } as any,
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });
      return { data: customer };
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("P2002")) {
        throw new Error("A customer with this email already exists");
      }
      throw new Error("Failed to create customer");
    }
  });

export const updateCustomer = actionClient
  .inputSchema(updateCustomerSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const customer = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });
      return { data: customer };
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("P2002")) {
          throw new Error("A customer with this email already exists");
        }
        if (error.message.includes("P2025")) {
          throw new Error("Customer not found");
        }
      }
      throw new Error("Failed to update customer");
    }
  });

export const deleteCustomer = actionClient
  .inputSchema(customerIdSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return { data: { success: true } };
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("P2025")) {
        throw new Error("Customer not found");
      }
      throw new Error("Failed to delete customer");
    }
  });

export const getCustomers = actionClient
  .inputSchema(getCustomersSchema)
  .action(async ({ parsedInput: { search, status, sort = "createdAt", order = "desc" } }) => {
    try {
      const where = {
        role: "user",
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const orderBy = { [sort]: order };

      const customers = await prisma.user.findMany({
        where,
        orderBy,
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });

      return { success: true, data: customers };
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      return { 
        success: false, 
        error: "Erreur lors de la récupération des clients",
        data: []
      };
    }
  }); 