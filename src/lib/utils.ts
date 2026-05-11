import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format large numbers to human-readable */
export function fmtLarge(n: number): string {
  if (!n || n === 0) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(1)  + "M";
  return n.toLocaleString();
}

/** Format crypto price based on magnitude */
export function fmtPrice(price: number): string {
  if (!price) return "$—";
  if (price >= 1000) return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1)    return "$" + price.toFixed(2);
  return "$" + price.toFixed(4);
}

/** Time ago from Unix timestamp ms */
export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Format seconds as M:SS */
export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
