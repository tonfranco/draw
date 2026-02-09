import { BaseElement, Point } from "@/types";

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: BaseElement,
  isSelected: boolean
) {
  ctx.save();
  ctx.globalAlpha = element.opacity / 100;
  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const fillColor = element.backgroundColor === "transparent" ? null : element.backgroundColor;

  switch (element.type) {
    case "rectangle":
      drawRectangle(ctx, element, fillColor);
      break;
    case "diamond":
      drawDiamond(ctx, element, fillColor);
      break;
    case "ellipse":
      drawEllipse(ctx, element, fillColor);
      break;
    case "line":
      drawLine(ctx, element);
      break;
    case "arrow":
      drawArrow(ctx, element);
      break;
    case "pencil":
      drawPencil(ctx, element);
      break;
    case "text":
      drawText(ctx, element);
      break;
  }

  if (isSelected) {
    drawSelectionBox(ctx, element);
  }

  ctx.restore();
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  el: BaseElement,
  fillColor: string | null
) {
  const r = 8;
  const x = el.x;
  const y = el.y;
  const w = el.width;
  const h = el.height;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  el: BaseElement,
  fillColor: string | null
) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const hw = el.width / 2;
  const hh = el.height / 2;

  ctx.beginPath();
  ctx.moveTo(cx, el.y);
  ctx.lineTo(el.x + el.width, cy);
  ctx.lineTo(cx, el.y + el.height);
  ctx.lineTo(el.x, cy);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  el: BaseElement,
  fillColor: string | null
) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rx = Math.abs(el.width / 2);
  const ry = Math.abs(el.height / 2);

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, el: BaseElement) {
  ctx.beginPath();
  ctx.moveTo(el.x, el.y);
  ctx.lineTo(el.x + el.width, el.y + el.height);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, el: BaseElement) {
  const startX = el.x;
  const startY = el.y;
  const endX = el.x + el.width;
  const endY = el.y + el.height;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 15;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawPencil(ctx: CanvasRenderingContext2D, el: BaseElement) {
  if (!el.points || el.points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(el.points[0].x, el.points[0].y);

  if (el.points.length === 2) {
    ctx.lineTo(el.points[1].x, el.points[1].y);
  } else {
    for (let i = 1; i < el.points.length - 1; i++) {
      const xc = (el.points[i].x + el.points[i + 1].x) / 2;
      const yc = (el.points[i].y + el.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
    }
    const last = el.points[el.points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, el: BaseElement) {
  if (!el.text) return;
  const fontSize = el.fontSize || 20;
  ctx.font = `${fontSize}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = el.strokeColor;
  ctx.textBaseline = "top";

  const lines = el.text.split("\n");
  lines.forEach((line, i) => {
    ctx.fillText(line, el.x, el.y + i * (fontSize * 1.2));
  });
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, el: BaseElement) {
  ctx.save();
  ctx.strokeStyle = "#4a90d9";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.globalAlpha = 1;

  const padding = 8;
  let x: number, y: number, w: number, h: number;

  if (el.type === "pencil" && el.points && el.points.length > 0) {
    const bounds = getPencilBounds(el.points);
    x = bounds.x - padding;
    y = bounds.y - padding;
    w = bounds.width + padding * 2;
    h = bounds.height + padding * 2;
  } else if (el.type === "text") {
    x = el.x - padding;
    y = el.y - padding;
    w = el.width + padding * 2;
    h = el.height + padding * 2;
  } else {
    const minX = Math.min(el.x, el.x + el.width);
    const minY = Math.min(el.y, el.y + el.height);
    const maxX = Math.max(el.x, el.x + el.width);
    const maxY = Math.max(el.y, el.y + el.height);
    x = minX - padding;
    y = minY - padding;
    w = maxX - minX + padding * 2;
    h = maxY - minY + padding * 2;
  }

  ctx.strokeRect(x, y, w, h);

  // Draw resize handles
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#4a90d9";
  ctx.lineWidth = 1.5;
  const handleSize = 8;
  const handles = [
    { x: x, y: y },
    { x: x + w, y: y },
    { x: x, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w / 2, y: y },
    { x: x + w / 2, y: y + h },
    { x: x, y: y + h / 2 },
    { x: x + w, y: y + h / 2 },
  ];

  handles.forEach((handle) => {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });

  ctx.restore();
}

function getPencilBounds(points: Point[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function getElementAtPosition(
  x: number,
  y: number,
  elements: BaseElement[]
): BaseElement | null {
  // Iterate in reverse to get topmost element first
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (isPointInElement(x, y, el)) {
      return el;
    }
  }
  return null;
}

function isPointInElement(x: number, y: number, el: BaseElement): boolean {
  const tolerance = 10;

  switch (el.type) {
    case "pencil": {
      if (!el.points) return false;
      for (let i = 0; i < el.points.length - 1; i++) {
        const dist = distanceToLineSegment(
          x,
          y,
          el.points[i].x,
          el.points[i].y,
          el.points[i + 1].x,
          el.points[i + 1].y
        );
        if (dist < tolerance) return true;
      }
      return false;
    }
    case "line":
    case "arrow": {
      const dist = distanceToLineSegment(
        x,
        y,
        el.x,
        el.y,
        el.x + el.width,
        el.y + el.height
      );
      return dist < tolerance;
    }
    case "text": {
      return (
        x >= el.x - tolerance &&
        x <= el.x + el.width + tolerance &&
        y >= el.y - tolerance &&
        y <= el.y + el.height + tolerance
      );
    }
    default: {
      const minX = Math.min(el.x, el.x + el.width);
      const minY = Math.min(el.y, el.y + el.height);
      const maxX = Math.max(el.x, el.x + el.width);
      const maxY = Math.max(el.y, el.y + el.height);
      return (
        x >= minX - tolerance &&
        x <= maxX + tolerance &&
        y >= minY - tolerance &&
        y <= maxY + tolerance
      );
    }
  }
}

function distanceToLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

export function getResizeHandle(
  x: number,
  y: number,
  el: BaseElement
): string | null {
  const padding = 8;
  const handleSize = 8;
  const tolerance = handleSize;

  let bx: number, by: number, bw: number, bh: number;

  if (el.type === "pencil" && el.points && el.points.length > 0) {
    const bounds = getPencilBounds(el.points);
    bx = bounds.x - padding;
    by = bounds.y - padding;
    bw = bounds.width + padding * 2;
    bh = bounds.height + padding * 2;
  } else {
    const minX = Math.min(el.x, el.x + el.width);
    const minY = Math.min(el.y, el.y + el.height);
    const maxX = Math.max(el.x, el.x + el.width);
    const maxY = Math.max(el.y, el.y + el.height);
    bx = minX - padding;
    by = minY - padding;
    bw = maxX - minX + padding * 2;
    bh = maxY - minY + padding * 2;
  }

  const handles: { name: string; x: number; y: number }[] = [
    { name: "nw", x: bx, y: by },
    { name: "ne", x: bx + bw, y: by },
    { name: "sw", x: bx, y: by + bh },
    { name: "se", x: bx + bw, y: by + bh },
    { name: "n", x: bx + bw / 2, y: by },
    { name: "s", x: bx + bw / 2, y: by + bh },
    { name: "w", x: bx, y: by + bh / 2 },
    { name: "e", x: bx + bw, y: by + bh / 2 },
  ];

  for (const handle of handles) {
    if (
      Math.abs(x - handle.x) < tolerance &&
      Math.abs(y - handle.y) < tolerance
    ) {
      return handle.name;
    }
  }

  return null;
}
