import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { Channel, User } from "@/generated/prisma/client";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: vi.fn() };
});

import { getCurrentUser } from "@/lib/auth";
import { DELETE } from "@/app/api/admin/channels/[id]/route";

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

function fakeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: "chan_1",
    name: "Fashion",
    organizationId: "org_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Channel;
}

const params = Promise.resolve({ id: "chan_1" });

describe("channels/[id] organization isolation", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(getCurrentUser).mockReset();
  });

  it("DELETE refuses to delete a channel from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.channel.findUnique.mockResolvedValue(fakeChannel({ organizationId: "org_2" }));

    const response = await DELETE(new Request("http://x", { method: "DELETE" }), { params });

    expect(response.status).toBe(404);
    expect(prismaMock.channel.delete).not.toHaveBeenCalled();
  });
});
