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
/**
 * Formats a date for notifications.
 * Example: Wed 17th July 2025
 */
export function formatNotificationDate(date: Date): string {
  const day = date.getDate();

  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : day % 10 === 1
      ? "st"
      : day % 10 === 2
      ? "nd"
      : day % 10 === 3
      ? "rd"
      : "th";

  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
  }).format(date);

  const month = new Intl.DateTimeFormat("en-GB", {
    month: "long",
  }).format(date);

  const year = date.getFullYear();

  return `${weekday} ${day}${suffix} ${month} ${year}`;
}
