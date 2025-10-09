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
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const createCustomer = actionClient
  .inputSchema(customerSchema)
  .action(async ({ parsedInput }) => {
    try {
      const customer = await prisma.user.create({
        data: {
          ...parsedInput,
          id: crypto.randomUUID(),
          emailVerified: false,
          role: "user",
          status: "active",
          createdAt: new Date(),
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
  .action(async ({ parsedInput: { search, status, sort = "createdAt", order = "desc", page = 1, limit = 10 } }) => {
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

      // Count total customers
      const total = await prisma.user.count({ where });

      // Get paginated customers
      const customers = await prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });

      return { 
        success: true, 
        data: customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      return { 
        success: false, 
        error: "Erreur lors de la récupération des clients",
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        }
      };
    }
  }); 