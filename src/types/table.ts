export interface Table {
  id: string;
  number: number;
  seats: number;
  location: string | null;
  status: "available" | "occupied" | "reserved";
} 