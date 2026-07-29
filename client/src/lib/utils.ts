import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn-compatible utility for safely composing Tailwind class names. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
