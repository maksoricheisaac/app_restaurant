import { createSafeActionClient } from "next-safe-action";

// Create the client with improved error handling and timeout configuration
export const actionClient = createSafeActionClient();