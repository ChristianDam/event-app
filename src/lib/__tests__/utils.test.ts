// ABOUTME: Unit tests for general utility functions
// ABOUTME: Tests core cn function for CSS class merging

import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
      expect(cn("class1", undefined, "class2", null)).toBe("class1 class2");
      expect(cn("class1", false && "hidden", true && "visible")).toBe("class1 visible");
    });

    it("should handle Tailwind class merging", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should handle complex inputs", () => {
      expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
      expect(cn({ class1: true, class2: false, class3: true })).toBe("class1 class3");
      expect(cn()).toBe("");
    });
  });
});
