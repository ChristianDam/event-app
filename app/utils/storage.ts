import type { Id } from "../../convex/_generated/dataModel";

/**
 * Generate a proper storage URL for a Convex file
 * This function provides a single source of truth for storage URL generation
 * and can be easily updated if the storage URL pattern changes
 */
export function getStorageUrl(fileId: Id<"_storage">): string {
  // In development, use the current origin
  // In production, this should be replaced with the actual Convex deployment URL
  const baseUrl = import.meta.env.PROD
    ? import.meta.env.VITE_CONVEX_SITE_URL || window.location.origin
    : window.location.origin;

  return `${baseUrl}/api/storage/${fileId}`;
}

/**
 * Generate a storage URL with fallback handling
 */
export function getStorageUrlWithFallback(
  fileId?: Id<"_storage">,
  fallback?: string
): string | undefined {
  if (!fileId) return fallback;
  return getStorageUrl(fileId);
}
