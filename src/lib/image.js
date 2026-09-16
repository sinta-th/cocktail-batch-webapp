import { fmt, formatDate } from "./format";
import { CATEGORY_LABEL } from "./constants";

export function downloadRecipeImage(entry) {
  const rowH = 34;
  const w = 640;
  const headerH = entry.category ? 140 : 112;
  const h = headerH + 46 + entry.ingredients.length * rowH;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#F5ECDD";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#8E1C2E";
  ctx.fillRect(0, 0, w, headerH);
  ctx.fillStyle = "#F5ECDD";
  ctx.font = "700 28px Georgia, serif";
  ctx.fillText(entry.name || "BATCH COCKTAIL", 36, 50);
  ctx.font = "16px Georgia, serif";
  ctx.fillText(
    `ขวดขนาด ${entry.bottleSize} มล  ·  ${entry.servings} เสิร์ฟ  ·  ใช้ของเหลว ${fmt(entry.totalUsed)} มล`,
    36,
    80
  );
  if (entry.category) {
    ctx.font = "600 14px Georgia, serif";
    ctx.fillText(CATEGORY_LABEL[entry.category] || entry.category, 36, 108);
  }

  let y = headerH + 46;
  ctx.font = "600 18px 'Noto Sans Thai', sans-serif";
  entry.ingredients.forEach((ing) => {
    ctx.fillStyle = "#2B1B14";
    ctx.textAlign = "left";
    ctx.fillText(ing.name, 36, y);
    ctx.textAlign = "right";
    ctx.fillText(`${fmt(ing.scaled)} มล`, w - 36, y);
    y += rowH;
  });

  ctx.strokeStyle = "rgba(43,27,20,0.2)";
  ctx.beginPath();
  ctx.moveTo(36, y);
  ctx.lineTo(w - 36, y);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#7A6A58";
  ctx.font = "14px 'Noto Sans Thai', sans-serif";
  ctx.fillText(formatDate(entry.date), 36, y + 30);

  const link = document.createElement("a");
  link.download = `${(entry.name || "batch").replace(/\s+/g, "-")}-${entry.bottleSize}ml.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
