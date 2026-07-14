import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { User } from "@/generated/prisma/client";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: vi.fn() };
});

import { getCurrentUser } from "@/lib/auth";
import { POST } from "@/app/api/admin/products/import/commit/route";

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

function importRequest(rows: unknown[]) {
  return new Request("http://x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
}

describe("products import commit organization isolation", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(getCurrentUser).mockReset();
    prismaMock.product.createMany.mockResolvedValue({ count: 1 });
  });

  it("assigns the current user's organizationId to every imported product", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));

    await POST(
      importRequest([
        {
          name: "Item",
          description: "desc",
          affiliateUrl: "https://example.com",
          imageUrl: "https://example.com/i.png",
        },
      ])
    );

    const call = prismaMock.product.createMany.mock.calls[0]?.[0];
    expect(call?.data).toEqual([expect.objectContaining({ organizationId: "org_1" })]);
  });

  it("only reuses a channel that belongs to the current user's organization, never another org's channel with the same name", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.channel.findFirst.mockResolvedValue(null);
    prismaMock.channel.create.mockResolvedValue({
      id: "chan_new",
      name: "Fashion",
      organizationId: "org_1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await POST(
      importRequest([
        {
          name: "Item",
          description: "desc",
          channel: "Fashion",
          affiliateUrl: "https://example.com",
          imageUrl: "https://example.com/i.png",
        },
      ])
    );

    expect(prismaMock.channel.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ name: "Fashion", organizationId: "org_1" }),
      })
    );
    expect(prismaMock.channel.upsert).not.toHaveBeenCalled();
  });
});
