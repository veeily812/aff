import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { User } from "@/generated/prisma/client";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: vi.fn() };
});

import { getCurrentUser } from "@/lib/auth";
import { GET, PATCH, DELETE } from "@/app/api/admin/users/[id]/route";

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

const params = Promise.resolve({ id: "user_2" });

describe("users/[id] organization isolation", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(getCurrentUser).mockReset();
  });

  it("GET returns 404 when the target user belongs to a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.user.findUnique.mockResolvedValue(
      fakeUser({ id: "user_2", organizationId: "org_2" })
    );

    const response = await GET(new Request("http://x"), { params });

    expect(response.status).toBe(404);
  });

  it("PATCH refuses to update a user from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.user.findUnique.mockResolvedValue(
      fakeUser({ id: "user_2", organizationId: "org_2", role: "STAFF" })
    );

    const request = new Request("http://x", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@example.com", role: "STAFF" }),
    });

    const response = await PATCH(request, { params });

    expect(response.status).toBe(404);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("DELETE refuses to delete a user from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.user.findUnique.mockResolvedValue(
      fakeUser({ id: "user_2", organizationId: "org_2", role: "STAFF" })
    );

    const response = await DELETE(new Request("http://x", { method: "DELETE" }), { params });

    expect(response.status).toBe(404);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });
});
