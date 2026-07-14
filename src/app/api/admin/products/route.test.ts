import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { User } from "@/generated/prisma/client";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: vi.fn() };
});
vi.mock("@/lib/supabase", () => ({
  uploadImage: vi.fn().mockResolvedValue("https://example.com/image.png"),
}));

import { getCurrentUser } from "@/lib/auth";
import { GET } from "@/app/api/admin/products/route";

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_1",
    email: "owner@example.com",
    passwordHash: "hash",
    role: "OWNER",
    channelId: null,
    organizationId: "org_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

describe("GET /api/admin/products", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(getCurrentUser).mockReset();
    prismaMock.product.findMany.mockResolvedValue([]);
  });

  it("scopes the query to the current user's organizationId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));

    await GET();

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org_1" }),
      })
    );
  });

  it("never returns products from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_2" }));

    await GET();

    const call = prismaMock.product.findMany.mock.calls[0]?.[0];
    expect(call?.where).not.toMatchObject({ organizationId: "org_1" });
    expect(call?.where).toMatchObject({ organizationId: "org_2" });
  });
});
