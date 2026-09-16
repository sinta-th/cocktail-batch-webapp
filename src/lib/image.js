import { fmt, formatDate, ratioString } from "./format";
import { CATEGORY_LABEL, COMPONENT_TYPE_LABEL } from "./constants";

function drawBottle(ctx, x, y, w, h, ratio) {
  const sx = w / 140;
  const sy = h / 330;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);

  const path = new Path2D();
  path.moveTo(55, 2);
  path.lineTo(85, 2);
  path.lineTo(85, 50);
  path.bezierCurveTo(85, 64, 110, 64, 110, 86);
  path.lineTo(110, 298);
  path.quadraticCurveTo(110, 320, 90, 320);
  path.lineTo(50, 320);
  path.quadraticCurveTo(30, 320, 30, 298);
  path.lineTo(30, 86);
  path.bezierCurveTo(30, 64, 55, 64, 55, 50);
  path.closePath();

  // glass base
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill(path);

  // liquid, clipped to bottle silhouette
  ctx.save();
  ctx.clip(path);
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const liquidTop = 320 - clampedRatio * (320 - 80);
  const grad = ctx.createLinearGradient(0, 80, 0, 325);
  grad.addColorStop(0, "#C6394F");
  grad.addColorStop(1, "#8E1C2E");
  ctx.fillStyle = grad;
  ctx.fillRect(15, liquidTop, 110, 330 - liquidTop);
  ctx.restore();

  // outline
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#2B1B14";
  ctx.stroke(path);

  // cap
  ctx.fillStyle = "#B4863A";
  ctx.fillRect(53, -6, 34, 14);

  ctx.restore();
}

export function downloadRecipeImage(entry) {
  const rowH = 32;
  const w = 680;
  const bottleAreaW = 220;
  const headerH = 100;
  const contentH = Math.max(entry.ingredients.length * rowH + 110, 300);
  const h = headerH + contentH;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#F5ECDD";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#8E1C2E";
  ctx.fillRect(0, 0, w, headerH);
  ctx.fillStyle = "#F5ECDD";
  ctx.font = "700 26px Georgia, serif";
  ctx.fillText(entry.componentName || entry.cocktailName || "BATCH COCKTAIL", 28, 42);
  ctx.font = "600 14px Georgia, serif";
  const subParts = [
    entry.cocktailName,
    entry.category ? CATEGORY_LABEL[entry.category] || entry.category : null,
    entry.componentType ? COMPONENT_TYPE_LABEL[entry.componentType] || entry.componentType : null,
  ].filter(Boolean);
  ctx.fillText(subParts.join("  ·  "), 28, 68);

  const ratio = entry.totalUsed / entry.bottleSize;
  drawBottle(ctx, 34, headerH + 20, 150, 250, ratio);

  const textX = bottleAreaW + 20;
  let y = headerH + 40;
  ctx.fillStyle = "#2B1B14";
  ctx.font = "600 15px 'Noto Sans Thai', sans-serif";
  ctx.fillText(`ขวดขนาด ${entry.bottleSize} มล  ·  ${entry.servings} เสิร์ฟ`, textX, y);
  y += 26;
  ctx.fillStyle = "#7A6A58";
  ctx.font = "13px 'Noto Sans Thai', sans-serif";
  ctx.fillText(`ใช้ของเหลวรวม ${fmt(entry.totalUsed)} มล`, textX, y);
  y += 34;

  ctx.font = "600 16px 'Noto Sans Thai', sans-serif";
  entry.ingredients.forEach((ing) => {
    ctx.fillStyle = "#2B1B14";
    ctx.textAlign = "left";
    ctx.fillText(ing.name, textX, y);
    ctx.textAlign = "right";
    ctx.fillText(`${fmt(ing.scaled)} มล`, w - 24, y);
    y += rowH;
  });

  const ratioText = ratioString(entry.ingredients.map((i) => i.perServe));
  if (ratioText) {
    ctx.fillStyle = "#7A6A58";
    ctx.font = "13px 'Noto Sans Thai', sans-serif";
    ctx.fillText(`อัตราส่วน ${ratioText}`, textX, y);
    y += 20;
  }

  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(43,27,20,0.2)";
  ctx.beginPath();
  ctx.moveTo(textX, y);
  ctx.lineTo(w - 24, y);
  ctx.stroke();

  ctx.fillStyle = "#7A6A58";
  ctx.font = "12.5px 'Noto Sans Thai', sans-serif";
  ctx.fillText(formatDate(entry.date), textX, y + 24);

  const link = document.createElement("a");
  const safeName = (entry.cocktailName || "batch").replace(/\s+/g, "-");
  const safeType = entry.componentType || "batch";
  link.download = `${safeName}-${safeType}-${entry.bottleSize}ml.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
