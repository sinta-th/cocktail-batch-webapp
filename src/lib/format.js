export function fmt(n) {
  return Number(n).toLocaleString("th-TH");
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Turns [45, 15, 7.5] into "6 : 2 : 1" (normalized against the smallest amount,
// rounded to at most 1 decimal place for readability).
export function ratioString(amounts) {
  const positive = amounts.filter((a) => a > 0);
  if (positive.length < 2) return "";
  const min = Math.min(...positive);
  if (!min) return "";
  return amounts
    .map((a) => {
      const r = a / min;
      const rounded = Math.round(r * 10) / 10;
      return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    })
    .join(" : ");
}
