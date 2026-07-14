import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { User } from "@/generated/prisma/client";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: vi.fn() };
});

import { getCurrentUser } from "@/lib/auth";
import { GET, POST } from "@/app/api/admin/posts/route";

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

describe("posts organization isolation", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(getCurrentUser).mockReset();
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.post.findUnique.mockResolvedValue(null);
  });

  it("GET scopes the list query to the current user's organizationId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));

    await GET();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org_1" }),
      })
    );
  });

  it("POST assigns the current user's organizationId to a new post", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.post.create.mockResolvedValue({} as never);

    const request = new Request("http://x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Hello",
        slug: "hello",
        body: "body",
        published: false,
      }),
    });

    await POST(request);

    expect(prismaMock.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org_1" }),
      })
    );
  });
});
