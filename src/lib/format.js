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
