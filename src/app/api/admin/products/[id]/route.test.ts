import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";
import type { Product, User } from "@/generated/prisma/client";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: vi.fn() };
});
vi.mock("@/lib/supabase", () => ({
  uploadImage: vi.fn().mockResolvedValue("https://example.com/image.png"),
  deleteImage: vi.fn().mockResolvedValue(undefined),
  storagePathFromPublicUrl: vi.fn().mockReturnValue(null),
}));

import { getCurrentUser } from "@/lib/auth";
import { GET, PATCH, DELETE } from "@/app/api/admin/products/[id]/route";

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

function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod_1",
    name: "Test Product",
    description: "desc",
    price: null,
    category: null,
    imageUrl: "https://example.com/image.png",
    affiliateUrl: "https://example.com",
    channelId: null,
    organizationId: "org_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Product;
}

const params = Promise.resolve({ id: "prod_1" });

describe("products/[id] organization isolation", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(getCurrentUser).mockReset();
  });

  it("GET returns 404 when the product belongs to a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.product.findUnique.mockResolvedValue(fakeProduct({ organizationId: "org_2" }));

    const response = await GET(new Request("http://x"), { params });

    expect(response.status).toBe(404);
  });

  it("GET returns 200 when the product belongs to the same organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.product.findUnique.mockResolvedValue(fakeProduct({ organizationId: "org_1" }));

    const response = await GET(new Request("http://x"), { params });

    expect(response.status).toBe(200);
  });

  it("PATCH refuses to update a product from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1" }));
    prismaMock.product.findUnique.mockResolvedValue(fakeProduct({ organizationId: "org_2" }));

    const formData = new FormData();
    formData.set("name", "New name");
    formData.set("description", "New desc");
    formData.set("price", "");
    formData.set("category", "");
    formData.set("channelId", "");
    formData.set("affiliateUrl", "https://example.com");

    const response = await PATCH(new Request("http://x", { method: "PATCH", body: formData }), {
      params,
    });

    expect(response.status).toBe(404);
    expect(prismaMock.product.update).not.toHaveBeenCalled();
  });

  it("DELETE refuses to delete a product from a different organization", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser({ organizationId: "org_1", role: "OWNER" }));
    prismaMock.product.findUnique.mockResolvedValue(fakeProduct({ organizationId: "org_2" }));

    const response = await DELETE(new Request("http://x", { method: "DELETE" }), { params });

    expect(response.status).toBe(404);
    expect(prismaMock.product.delete).not.toHaveBeenCalled();
  });
});
