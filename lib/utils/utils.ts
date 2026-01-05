export function formatAmount(amount: number, smallScreen = false): string {
  if (smallScreen) {
    return amount >= 0 ? `+${amount}` : `${amount}`;
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

export const OFFICIAL_ROLES = ["chairperson", "secretary", "treasurer"] as const;

export type OfficialRole = (typeof OFFICIAL_ROLES)[number];

export function isOfficialRole(role: string): role is OfficialRole {
  return OFFICIAL_ROLES.includes(role as OfficialRole);
}