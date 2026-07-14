import { describe, expect, it } from "vitest";
import { getChannelScope, getOrganizationScope } from "@/lib/permissions";

describe("getOrganizationScope", () => {
  it("returns the user's organizationId regardless of role", () => {
    expect(getOrganizationScope({ organizationId: "org_1" })).toBe("org_1");
    expect(
      getOrganizationScope({ organizationId: "org_2", role: "OWNER" } as never)
    ).toBe("org_2");
  });

  it("throws when the user has no organizationId", () => {
    expect(() => getOrganizationScope({ organizationId: null })).toThrow(
      /organization/i
    );
  });
});

describe("getChannelScope (regression)", () => {
  it("still only restricts CHANNEL_STAFF", () => {
    expect(
      getChannelScope({ role: "CHANNEL_STAFF", channelId: "chan_1" })
    ).toBe("chan_1");
    expect(getChannelScope({ role: "OWNER", channelId: null })).toBeNull();
  });
});
