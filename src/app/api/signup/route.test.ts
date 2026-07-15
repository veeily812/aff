import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { Organization, PrismaClient, User } from "@/generated/prisma/client";

const sessionSave = vi.fn();
vi.mock("@/lib/session", () => ({
  getAdminSession: vi.fn().mockResolvedValue({
    save: (...args: unknown[]) => sessionSave(...args),
  }),
}));

import { POST } from "@/app/api/signup/route";

function signupRequest(body: unknown) {
  return new Request("http://x/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fakeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "org_new",
    name: "Vy Beauty",
    slug: "vy-beauty",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Organization;
}

function fakeOwner(overrides: Partial<User> = {}): User {
  return {
    id: "user_new",
    email: "vy@example.com",
    passwordHash: "hash",
    role: "OWNER",
    channelId: null,
    organizationId: "org_new",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

describe("POST /api/signup", () => {
  beforeEach(() => {
    resetPrismaMock();
    sessionSave.mockReset();
    // $transaction(callback) should run the callback against the same mock client.
    prismaMock.$transaction.mockImplementation(((fn: (tx: PrismaClient) => Promise<unknown>) =>
      fn(prismaMock as unknown as PrismaClient)) as never);
  });

  it("creates an organization and its OWNER account, then logs them in", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.organization.findUnique.mockResolvedValue(null);
    prismaMock.organization.create.mockResolvedValue(fakeOrg());
    prismaMock.user.create.mockResolvedValue(fakeOwner());

    const response = await POST(
      signupRequest({ organizationName: "Vy Beauty", email: "vy@example.com", password: "password123" })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Vy Beauty", slug: "vy-beauty" }),
      })
    );
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "OWNER", organizationId: "org_new" }),
      })
    );
    expect(sessionSave).toHaveBeenCalled();
  });

  it("appends a numeric suffix when the slug is taken", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.organization.findUnique
      .mockResolvedValueOnce(fakeOrg({ slug: "vy-beauty" }))
      .mockResolvedValueOnce(null);
    prismaMock.organization.create.mockResolvedValue(fakeOrg({ slug: "vy-beauty-2" }));
    prismaMock.user.create.mockResolvedValue(fakeOwner());

    const response = await POST(
      signupRequest({ organizationName: "Vy Beauty", email: "vy@example.com", password: "password123" })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "vy-beauty-2" }),
      })
    );
  });

  it("rejects an email that already has an account without creating anything", async () => {
    prismaMock.user.findUnique.mockResolvedValue(fakeOwner({ email: "vy@example.com" }));

    const response = await POST(
      signupRequest({ organizationName: "Vy Beauty", email: "vy@example.com", password: "password123" })
    );

    expect(response.status).toBe(409);
    expect(prismaMock.organization.create).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(sessionSave).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    const response = await POST(
      signupRequest({ organizationName: "", email: "not-an-email", password: "short" })
    );

    expect(response.status).toBe(400);
    expect(prismaMock.organization.create).not.toHaveBeenCalled();
  });
});
