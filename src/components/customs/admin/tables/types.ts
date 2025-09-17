import { z } from "zod";

export interface TableData {
  id: string;
  number: number;
  seats: number;
  location: string | null;
  status: "available" | "occupied" | "reserved";
  _count: {
    orders: number;
    reservations: number;
  };
}

export const formSchema = z.object({
  number: z.number().int().min(1, "Le numéro de table doit être au moins 1"),
  seats: z.number().int().min(1, "Le nombre de places doit être au moins 1"),
  status: z.enum(["available", "occupied", "reserved"]),
  location: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export type SortField = "number" | "seats" | "location";
export type SortOrder = "asc" | "desc"; 