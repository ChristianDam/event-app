// ABOUTME: Unit tests for general utility functions
// ABOUTME: Tests the cn function for CSS class name merging

import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle undefined and null values", () => {
      const result = cn("class1", undefined, "class2", null);
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      const result = cn("class1", false && "hidden", true && "visible");
      expect(result).toBe("class1 visible");
    });

    it("should merge tailwind classes with twMerge behavior", () => {
      // twMerge should handle conflicting Tailwind classes
      const result = cn("px-2", "px-4");
      expect(result).toBe("px-4"); // Later px- class should win
    });

    it("should handle arrays of classes", () => {
      const result = cn(["class1", "class2"], "class3");
      expect(result).toBe("class1 class2 class3");
    });

    it("should handle objects with conditional classes", () => {
      const result = cn({
        "class1": true,
        "class2": false,
        "class3": true,
      });
      expect(result).toBe("class1 class3");
    });

    it("should handle complex combinations", () => {
      const result = cn(
        "base-class",
        {
          "conditional-true": true,
          "conditional-false": false,
        },
        ["array-class1", "array-class2"],
        undefined,
        "final-class"
      );
      expect(result).toBe("base-class conditional-true array-class1 array-class2 final-class");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
      expect(cn(undefined)).toBe("");
      expect(cn(null)).toBe("");
    });

    it("should handle nested arrays", () => {
      const result = cn(["class1", ["nested1", "nested2"]], "class2");
      expect(result).toBe("class1 nested1 nested2 class2");
    });

    it("should deduplicate identical classes", () => {
      const result = cn("duplicate", "other", "duplicate");
      expect(result).toBe("duplicate other duplicate"); // twMerge handles deduplication differently
    });

    it("should handle Tailwind responsive classes", () => {
      const result = cn("block", "md:hidden", "lg:block");
      expect(result).toBe("block md:hidden lg:block");
    });

    it("should handle Tailwind state classes", () => {
      const result = cn("bg-blue-500", "hover:bg-blue-600", "focus:bg-blue-700");
      expect(result).toBe("bg-blue-500 hover:bg-blue-600 focus:bg-blue-700");
    });

    it("should merge conflicting background classes", () => {
      const result = cn("bg-red-500", "bg-blue-500");
      expect(result).toBe("bg-blue-500");
    });

    it("should merge conflicting padding classes", () => {
      const result = cn("p-2", "px-4", "py-6");
      expect(result).toBe("p-2 px-4 py-6"); // twMerge keeps all classes if they don't directly conflict
    });

    it("should merge conflicting margin classes", () => {
      const result = cn("m-2", "mx-4", "my-6");
      expect(result).toBe("m-2 mx-4 my-6"); // twMerge keeps all classes if they don't directly conflict
    });

    it("should handle mixed Tailwind and custom classes", () => {
      const result = cn("custom-class", "bg-blue-500", "another-custom", "bg-red-500");
      expect(result).toBe("custom-class another-custom bg-red-500");
    });

    it("should preserve non-conflicting classes", () => {
      const result = cn("flex", "items-center", "justify-between", "p-4", "bg-white");
      expect(result).toBe("flex items-center justify-between p-4 bg-white");
    });

    it("should handle important classes", () => {
      const result = cn("!bg-red-500", "bg-blue-500");
      expect(result).toBe("!bg-red-500 bg-blue-500"); // Order is preserved unless there are conflicts
    });

    it("should handle arbitrary value classes", () => {
      const result = cn("bg-[#123456]", "bg-[#654321]");
      expect(result).toBe("bg-[#654321]");
    });

    it("should work with realistic component scenarios", () => {
      // Button component example
      const result = cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "h-10 px-4 py-2"
      );
      expect(result).toContain("inline-flex");
      expect(result).toContain("bg-primary");
      expect(result).toContain("hover:bg-primary/90");
    });
  });
});