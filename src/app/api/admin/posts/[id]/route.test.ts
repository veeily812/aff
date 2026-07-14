import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { Post, User } from "@/generated/prisma/client";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: vi.fn() };
});

import { getCurrentUser } from "@/lib/auth";
import { GET, PATCH, DELETE } from "@/app/api/admin/posts/[id]/route";

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

function fakePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post_1",
    title: "Title",
    slug: "title",
    coverImage: null,
    body: "body",
    published: true,
    channelId: null,
    organizationId: "org_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Post;
}

const params = Promise.resolve({ id: "post_1" });

describe("posts/[id] organization isolation", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(getCurrentUser).mockReset();
  });

  it("GET returns 404 when the post belongs to a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.post.findUnique.mockResolvedValue(fakePost({ organizationId: "org_2" }));

    const response = await GET(new Request("http://x"), { params });

    expect(response.status).toBe(404);
  });

  it("PATCH refuses to update a post from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.post.findUnique.mockImplementation(((args: unknown) => {
      const where = (args as { where: { id?: string; slug?: string } }).where;
      return Promise.resolve(where.slug ? null : fakePost({ organizationId: "org_2" }));
    }) as never);

    const request = new Request("http://x", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New", slug: "new", body: "b", published: false }),
    });

    const response = await PATCH(request, { params });

    expect(response.status).toBe(404);
    expect(prismaMock.post.update).not.toHaveBeenCalled();
  });

  it("DELETE refuses to delete a post from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1", role: "OWNER" }));
    prismaMock.post.findUnique.mockResolvedValue(fakePost({ organizationId: "org_2" }));

    const response = await DELETE(new Request("http://x", { method: "DELETE" }), { params });

    expect(response.status).toBe(404);
    expect(prismaMock.post.delete).not.toHaveBeenCalled();
  });
});
