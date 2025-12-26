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
