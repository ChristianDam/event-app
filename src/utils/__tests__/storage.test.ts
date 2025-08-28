// ABOUTME: Unit tests for storage utility functions  
// ABOUTME: Tests core URL generation functionality

import { beforeEach, describe, expect, it } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { getStorageUrl, getStorageUrlWithFallback } from "../storage";

describe("storage utilities", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      configurable: true,
    });
  });

  describe("getStorageUrl", () => {
    it("should generate storage URLs", () => {
      const fileId = "storage_id_123" as Id<"_storage">;
      const result = getStorageUrl(fileId);
      expect(result).toBe("http://localhost:3000/api/storage/storage_id_123");
    });

    it("should handle special characters in file IDs", () => {
      const fileId = "storage-id_with-special.chars" as Id<"_storage">;
      const result = getStorageUrl(fileId);
      expect(result).toBe("http://localhost:3000/api/storage/storage-id_with-special.chars");
    });
  });

  describe("getStorageUrlWithFallback", () => {
    it("should return storage URL when fileId provided", () => {
      const fileId = "valid_file_id" as Id<"_storage">;
      const fallback = "https://example.com/default-image.png";
      
      expect(getStorageUrlWithFallback(fileId, fallback)).toBe("http://localhost:3000/api/storage/valid_file_id");
    });

    it("should return fallback when fileId is undefined", () => {
      expect(getStorageUrlWithFallback(undefined, "https://example.com/default.png")).toBe("https://example.com/default.png");
      expect(getStorageUrlWithFallback(undefined, undefined)).toBeUndefined();
    });
  });

});
