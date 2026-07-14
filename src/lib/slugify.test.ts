import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates plain names", () => {
    expect(slugify("Jane's Beauty Picks")).toBe("jane-s-beauty-picks");
  });

  it("transliterates Vietnamese accents", () => {
    expect(slugify("Đồ Điện Tử Của Vy")).toBe("do-dien-tu-cua-vy");
  });

  it("strips leading/trailing separators", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });
});
