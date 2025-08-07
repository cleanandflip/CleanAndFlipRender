import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // Force dark theme classes
  const merged = twMerge(clsx(inputs));
  
  // Replace any white/light classes
  return merged
    .replace(/bg-white/g, 'bg-gray-900')
    .replace(/text-black/g, 'text-white')
    .replace(/text-gray-900/g, 'text-white')
    .replace(/border-gray-200/g, 'border-gray-700')
    .replace(/border-gray-300/g, 'border-gray-700')
    .replace(/bg-gray-50/g, 'bg-gray-900')
    .replace(/bg-gray-100/g, 'bg-gray-800');
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}
