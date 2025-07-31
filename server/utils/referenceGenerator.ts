import { db } from "../db";
import { equipmentSubmissions } from "@shared/schema";
import { eq } from "drizzle-orm";

export function generateReferenceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 4-digit number
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `REF-${year}${month}${day}-${random}`;
}

// Ensure uniqueness
export async function generateUniqueReference(): Promise<string> {
  let reference: string;
  let isUnique = false;
  
  while (!isUnique) {
    reference = generateReferenceNumber();
    const existing = await db.select()
      .from(equipmentSubmissions)
      .where(eq(equipmentSubmissions.referenceNumber, reference))
      .limit(1);
    
    isUnique = existing.length === 0;
  }
  
  return reference!;
}

// Type for status history tracking
export type StatusHistoryEntry = {
  status: string;
  timestamp: string;
  changedBy: string;
  notes?: string;
};