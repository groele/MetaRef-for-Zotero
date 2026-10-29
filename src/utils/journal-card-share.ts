import { getString } from "./locale";

export interface JournalCardData {
  doc: Document;
  publication: string;
  displayedRankings: { key: string; labelID: string; value: string }[];
  sciRanking?: { key: string; labelID: string; value: string };
  rows: { label: string; value: string; matched?: boolean }[];
  matchBases: string[];
  issn?: string;
}

export function shareJournalCard(data: JournalCardData) {
  const { doc, publication } = data;
  if (!doc)
    return;

  const win = doc.defaultView;
  const cardText = generateCardText(data);

  // 1. Copy text to clipboard as primary/fallback text
  copyTextToClipboard(win, cardText);

  // 2. Render canvas card
  const canvas = renderCardCanvas(doc, data);
  let blobPromise: Promise<Blob | null> | null = null;
  if (canvas && typeof canvas.toBlob === "function") {
    blobPromise = new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    blobPromise.then((blob) => {
      const nav = win?.navigator as any;
      if (blob && nav?.clipboard?.write && typeof (win as any)?.ClipboardItem !== "undefined") {
        void nav.clipboard.write([
          new (win as any).ClipboardItem({ "image/png": blob }),
        ]).catch(() => {});
      }
    });
  }

  // 3. Show a modern preview and share modal
  showShareModal({
    doc,
    win,
    publication,
    canvas,
    cardText,
    blobPromise,
  });
}

function generateCardText(data: JournalCardData): string {
  const lines: string[] = [];
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("【Zotero MetaFlow · 期刊索引卡片】");
  lines.push(`期刊：${data.publication}`);
  lines.push("────────────────────────────");

  if (data.displayedRankings.length > 0) {
    lines.push(`[${getString("journal-rankings-heading" as any) || "评价与指标"}]`);
    for (const r of data.displayedRankings) {
      lines.push(`· ${getString(r.labelID as any)}: ${r.value}`);
    }
    lines.push("");
  }

  const hasIndex = Boolean(data.sciRanking) || data.rows.length > 0 || data.matchBases.length > 0;
  if (hasIndex) {
    lines.push(`[${getString("journal-indexing-heading" as any) || "学科与收录"}]`);
    if (data.sciRanking) {
      lines.push(`· ${getString(data.sciRanking.labelID as any)}: ${data.sciRanking.value}`);
    }
    for (const row of data.rows) {
      lines.push(`· ${row.label}: ${row.value}`);
    }
    for (const basis of data.matchBases) {
      lines.push(`· ${basis}`);
    }
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("由 Zotero MetaFlow 导出");
  return lines.join("\n");
}

function copyTextToClipboard(win: Window | null | undefined, text: string) {
  try {
    if (typeof Components !== "undefined" && (Components as any)?.classes) {
      const helper = (Components.classes as any)["@mozilla.org/widget/clipboardhelper;1"].getService(
        (Components.interfaces as any).nsIClipboardHelper,
      );
      helper.copyString(text);
      return;
    }
  }
  catch {}

  const nav = win?.navigator as any;
  if (nav?.clipboard?.writeText) {
    nav.clipboard.writeText(text).catch(() => {});
  }
}

function renderCardCanvas(doc: Document, data: JournalCardData): HTMLCanvasElement | null {
  try {
    const canvas = doc.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
    const rawCtx = canvas.getContext("2d");
    if (!rawCtx)
      return null;
    const ctx = rawCtx as unknown as CanvasRenderingContext2D;

    const scale = 2; // Retina scale
    const width = 380;
    const padding = 22;
    const contentWidth = width - padding * 2;

    // Calculate layout heights
    let currentY = padding;

    // Header height
    const headerH = 28;
    currentY += headerH + 14;

    // Title height
    ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    const titleLines = wrapText(ctx, data.publication, contentWidth);
    const titleH = titleLines.length * 24;
    currentY += titleH + 16;

    // Section 1: Rankings
    const section1H = data.displayedRankings.length > 0
      ? 24 + data.displayedRankings.length * 28 + 14
      : 0;
    currentY += section1H;

    // Section 2: Indexing
    const indexRowsCount = (data.sciRanking ? 1 : 0) + data.rows.length + data.matchBases.length;
    const section2H = indexRowsCount > 0
      ? 24 + indexRowsCount * 28 + 14
      : 0;
    currentY += section2H;

    // Footer height
    const footerH = 26;
    currentY += footerH + padding;

    const height = Math.ceil(currentY);

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Draw card background
    drawRoundedRect(ctx, 0, 0, width, height, 16);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(1, "#f8fafc");
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Card border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Header: Brand & Date
    let drawY = padding;

    // Logo accent dot
    ctx.beginPath();
    ctx.arc(padding + 6, drawY + 8, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.fill();

    ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#2563eb";
    ctx.textAlign = "left";
    ctx.fillText("Zotero MetaFlow · 期刊索引", padding + 16, drawY + 12);

    // Date
    const today = new Date().toISOString().slice(0, 10);
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText(today, width - padding, drawY + 12);

    drawY += headerH;

    // Top separator line
    ctx.beginPath();
    ctx.moveTo(padding, drawY);
    ctx.lineTo(width - padding, drawY);
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawY += 16;

    // Journal Title
    ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    for (const line of titleLines) {
      ctx.fillText(line, padding, drawY + 14);
      drawY += 24;
    }

    drawY += 8;

    // Section 1: Rankings
    if (data.displayedRankings.length > 0) {
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "left";
      ctx.fillText(getString("journal-rankings-heading" as any) || "评价与指标", padding, drawY + 12);
      drawY += 22;

      for (const ranking of data.displayedRankings) {
        const label = getString(ranking.labelID as any);
        ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        ctx.fillText(label, padding, drawY + 14);

        ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "right";
        ctx.fillText(ranking.value, width - padding, drawY + 14);
        drawY += 26;
      }
      drawY += 8;
    }

    // Section 2: Indexing
    if (indexRowsCount > 0) {
      // Light divider
      ctx.beginPath();
      ctx.moveTo(padding, drawY);
      ctx.lineTo(width - padding, drawY);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.stroke();
      drawY += 14;

      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "left";
      ctx.fillText(getString("journal-indexing-heading" as any) || "学科与收录", padding, drawY + 12);
      drawY += 22;

      if (data.sciRanking) {
        ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        ctx.fillText(getString(data.sciRanking.labelID as any), padding, drawY + 14);

        ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "right";
        ctx.fillText(data.sciRanking.value, width - padding, drawY + 14);
        drawY += 26;
      }

      for (const row of data.rows) {
        ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        ctx.fillText(row.label, padding, drawY + 14);

        ctx.font = row.matched ? "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = row.matched ? "#0f172a" : "#64748b";
        ctx.textAlign = "right";
        ctx.fillText(row.value, width - padding, drawY + 14);
        drawY += 26;
      }

      for (const basis of data.matchBases) {
        ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        if (data.issn && basis.includes(data.issn)) {
          ctx.fillText("匹配依据·ISSN", padding, drawY + 14);
          ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillStyle = "#0f172a";
          ctx.textAlign = "right";
          ctx.fillText(data.issn, width - padding, drawY + 14);
        }
        else {
          ctx.fillText(basis, padding, drawY + 14);
        }
        drawY += 26;
      }
      drawY += 8;
    }

    // Footer
    ctx.beginPath();
    ctx.moveTo(padding, drawY);
    ctx.lineTo(width - padding, drawY);
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    ctx.stroke();
    drawY += 12;

    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("由 Zotero MetaFlow 生成 · 仅供学术参考", width / 2, drawY + 10);

    return canvas;
  }
  catch {
    return null;
  }
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    }
    else {
      currentLine = testLine;
    }
  }
  if (currentLine)
    lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

interface ModalOptions {
  doc: Document;
  win: Window | null | undefined;
  publication: string;
  canvas: HTMLCanvasElement | null;
  cardText: string;
  blobPromise: Promise<Blob | null> | null;
}

function showShareModal(opts: ModalOptions) {
  const { doc, win, publication, canvas, cardText, blobPromise } = opts;
  const overlay = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
  overlay.setAttribute("id", "metaflow-share-card-modal");
  overlay.setAttribute("style", [
    "position:fixed",
    "top:0",
    "left:0",
    "width:100vw",
    "height:100vh",
    "background:rgba(15,23,42,0.65)",
    "backdrop-filter:blur(4px)",
    "z-index:999999",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:20px",
    "box-sizing:border-box",
    "font-family:system-ui,-apple-system,BlinkMacSystemFont,'Microsoft YaHei',sans-serif",
  ].join(";"));

  const container = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
  container.setAttribute("style", [
    "background:var(--material-background,#ffffff)",
    "color:var(--fill-primary,#0f172a)",
    "border-radius:12px",
    "box-shadow:0 20px 25px -5px rgba(0,0,0,0.2),0 10px 10px -5px rgba(0,0,0,0.1)",
    "max-width:440px",
    "width:100%",
    "max-height:90vh",
    "display:flex",
    "flex-direction:column",
    "overflow:hidden",
  ].join(";"));

  // Top Bar
  const topBar = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
  topBar.setAttribute("style", "display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--fill-quinary,#e2e8f0);");
  const modalTitle = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
  modalTitle.textContent = getString("journal-share-card" as any) || "分享期刊卡片";
  modalTitle.setAttribute("style", "font-size:14px;font-weight:600;");

  const closeBtn = doc.createElementNS("http://www.w3.org/1999/xhtml", "button") as HTMLButtonElement;
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("type", "button");
  closeBtn.setAttribute("style", "border:none;background:transparent;font-size:16px;color:var(--fill-secondary,#64748b);cursor:pointer;padding:4px 8px;border-radius:4px;");
  closeBtn.addEventListener("click", () => overlay.remove());

  topBar.append(modalTitle, closeBtn);

  // Toast Notice Bar
  const toastBar = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
  toastBar.textContent = "✓ 已生成期刊卡片并复制到剪贴板，可直接粘贴！";
  toastBar.setAttribute("style", "background:#ecfdf5;color:#065f46;font-size:12px;padding:8px 16px;text-align:center;font-weight:500;border-bottom:1px solid #d1fae5;");

  // Preview Body
  const previewBody = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
  previewBody.setAttribute("style", "padding:16px;overflow-y:auto;display:flex;justify-content:center;align-items:center;background:var(--fill-quinary,#f8fafc);");

  if (canvas) {
    const img = doc.createElementNS("http://www.w3.org/1999/xhtml", "img") as HTMLImageElement;
    img.src = canvas.toDataURL("image/png");
    img.setAttribute("style", "max-width:100%;max-height:480px;height:auto;border-radius:10px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);");
    previewBody.append(img);
  }
  else {
    const pre = doc.createElementNS("http://www.w3.org/1999/xhtml", "pre") as HTMLElement;
    pre.textContent = cardText;
    pre.setAttribute("style", "white-space:pre-wrap;font-size:12px;margin:0;padding:12px;background:#ffffff;border-radius:8px;");
    previewBody.append(pre);
  }

  // Action Buttons Footer
  const footer = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
  footer.setAttribute("style", "display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--fill-quinary,#e2e8f0);justify-content:flex-end;flex-wrap:wrap;");

  const btnStyle = "padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid var(--fill-quinary,#cbd5e1);background:var(--material-background,#ffffff);color:var(--fill-primary,#1e293b);font-weight:500;transition:all 0.15s ease;";

  // Button 1: Copy Image
  const copyImgBtn = doc.createElementNS("http://www.w3.org/1999/xhtml", "button") as HTMLButtonElement;
  copyImgBtn.textContent = "📋 复制图片";
  copyImgBtn.setAttribute("type", "button");
  copyImgBtn.setAttribute("style", btnStyle);
  copyImgBtn.addEventListener("click", () => {
    void (async () => {
      const nav = win?.navigator as any;
      if (blobPromise && nav?.clipboard?.write && typeof (win as any)?.ClipboardItem !== "undefined") {
        const blob = await blobPromise;
        if (blob) {
          await nav.clipboard.write([new (win as any).ClipboardItem({ "image/png": blob })]);
          toastBar.textContent = "✓ 图片已再次复制到剪贴板！";
          return;
        }
      }
      copyTextToClipboard(win, cardText);
      toastBar.textContent = "✓ 文本卡片已复制到剪贴板！";
    })();
  });

  // Button 2: Save Image
  const saveImgBtn = doc.createElementNS("http://www.w3.org/1999/xhtml", "button") as HTMLButtonElement;
  saveImgBtn.textContent = "💾 保存图片";
  saveImgBtn.setAttribute("type", "button");
  saveImgBtn.setAttribute("style", btnStyle);
  saveImgBtn.addEventListener("click", () => {
    if (canvas) {
      const link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a") as HTMLAnchorElement;
      const safeName = publication.replace(/[\\/:*?"<>|]/g, "_").slice(0, 50) || "期刊卡片";
      link.download = `${safeName}_期刊索引卡片.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toastBar.textContent = "✓ 图片下载已开始！";
    }
  });

  // Button 3: Copy Text
  const copyTxtBtn = doc.createElementNS("http://www.w3.org/1999/xhtml", "button") as HTMLButtonElement;
  copyTxtBtn.textContent = "📄 复制文本";
  copyTxtBtn.setAttribute("type", "button");
  copyTxtBtn.setAttribute("style", btnStyle);
  copyTxtBtn.addEventListener("click", () => {
    copyTextToClipboard(win, cardText);
    toastBar.textContent = "✓ 格式化文本已复制到剪贴板！";
  });

  footer.append(copyImgBtn, saveImgBtn, copyTxtBtn);

  container.append(topBar, toastBar, previewBody, footer);
  overlay.append(container);

  // Close when clicking backdrop
  overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === overlay)
      overlay.remove();
  });

  // Close on ESC key
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      overlay.remove();
      doc.removeEventListener("keydown", escHandler);
    }
  };
  doc.addEventListener("keydown", escHandler);

  const host = doc.getElementById("zotero-pane") || doc.documentElement || doc.body;
  host?.append(overlay);
}
