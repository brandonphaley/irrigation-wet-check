// Client-side PDF report generation + native share.
//
// Decision 3 (phone-only build): the summary PDF is generated on-device and
// the user shares it via the phone's share sheet (email/AirDrop/etc.). No
// server is involved. Uses jsPDF for a clean, text-based, archival layout.

import { jsPDF } from "jspdf";
import type { Site, Zone } from "../types";
import { LABOR_RATE } from "./constants";

export interface ReportData {
  site: Site;
  zones: Zone[];
}

function fmtDays(days: string[]): string {
  return days.length ? days.join("·") : "—";
}

export function buildReportPdf({ site, zones }: ReportData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const accent: [number, number, number] = [43, 122, 140];
  const crit: [number, number, number] = [183, 65, 50];
  const warn: [number, number, number] = [176, 124, 30];
  const ink: [number, number, number] = [33, 41, 51];
  const ink3: [number, number, number] = [120, 130, 140];

  const pageH = doc.internal.pageSize.getHeight();
  const ensureSpace = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header ──
  doc.setFillColor(...accent);
  doc.rect(margin, y, 14, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...ink);
  doc.text("Irrigation Wet Check", margin + 22, y + 12);
  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${site.name}  (${site.code})`, margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...ink3);
  doc.text(site.address, margin, y);
  y += 12;
  doc.text(`${site.campus}  ·  ${site.date}`, margin, y);
  y += 12;
  doc.text(
    `Controller: ${site.controller.make} ${site.controller.model} · prog ${site.controller.program}  ·  Water: ${site.water}  ·  ${site.controller.zones} zones`,
    margin,
    y
  );
  y += 12;
  doc.text(
    `Tech: ${site.tech.name} (${site.tech.id})  ·  Weather: ${site.weather}`,
    margin,
    y
  );
  y += 18;
  doc.setDrawColor(...ink3);
  doc.line(margin, y, margin + contentW, y);
  y += 22;

  // ── Summary counts ──
  const issues = zones.flatMap((z) => z.issues.map((i) => ({ ...i, zone: z.num, name: z.name })));
  const fix = issues.filter((i) => i.sev === "fix");
  const watch = issues.filter((i) => i.sev === "watch");
  const adjustedZones = zones.filter((z) => z.adjustments && Object.keys(z.adjustments).length);
  const adjCount = zones.reduce(
    (s, z) => s + (z.adjustments ? Object.keys(z.adjustments).length : 0),
    0
  );
  const cost = fix.reduce((s, i) => s + i.n * LABOR_RATE.fix, 0) + watch.reduce((s, i) => s + i.n * LABOR_RATE.watch, 0);

  const sectionTitle = (label: string) => {
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...accent);
    doc.text(label.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(220, 224, 228);
    doc.line(margin, y, margin + contentW, y);
    y += 14;
  };

  sectionTitle("Summary");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...ink);
  const summaryLines = [
    `Zones inspected: ${zones.length}`,
    `Issues: ${issues.length}  (${fix.length} fix-now · ${watch.length} watch)`,
    `Schedule adjustments: ${adjCount} across ${adjustedZones.length} zone(s)`,
    `Estimated labor: $${cost}  (materials separate)`,
  ];
  summaryLines.forEach((l) => {
    doc.text(l, margin, y);
    y += 14;
  });
  y += 8;

  // ── Schedule adjustments ──
  sectionTitle("Proposed schedule adjustments");
  if (adjustedZones.length === 0) {
    doc.setTextColor(...ink3);
    doc.setFontSize(10);
    doc.text("No schedule changes proposed.", margin, y);
    y += 16;
  } else {
    adjustedZones.forEach((z) => {
      Object.entries(z.adjustments!).forEach(([k, a]) => {
        if (!a) return;
        const orig = z.programs[k as "A" | "B" | "C" | "D"];
        ensureSpace(44);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...ink);
        doc.text(`Z${String(z.num).padStart(2, "0")}·${k}  ${z.name}`, margin, y);
        y += 13;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...ink3);
        doc.text(
          `${orig.runtime}m · ${fmtDays(orig.days)}   ->   ${a.runtime}m · ${fmtDays(a.days)}`,
          margin + 10,
          y
        );
        y += 12;
        if (a.reason) {
          doc.setTextColor(...ink);
          const wrapped = doc.splitTextToSize(`"${a.reason}"`, contentW - 10);
          doc.text(wrapped, margin + 10, y);
          y += wrapped.length * 11;
        }
        y += 8;
      });
    });
  }
  y += 4;

  // ── Issue lists ──
  const issueList = (label: string, list: typeof issues, color: [number, number, number]) => {
    sectionTitle(`${label} · ${list.length}`);
    if (list.length === 0) {
      doc.setTextColor(...ink3);
      doc.setFontSize(10);
      doc.text("None.", margin, y);
      y += 16;
      return;
    }
    list.forEach((i) => {
      ensureSpace(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...color);
      doc.text(`Z${String(i.zone).padStart(2, "0")}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...ink);
      doc.text(`${i.t}  ·  ${i.name}   x${i.n}`, margin + 34, y);
      if (i.note) {
        y += 11;
        doc.setTextColor(...ink3);
        doc.setFontSize(9);
        const wrapped = doc.splitTextToSize(i.note, contentW - 34);
        doc.text(wrapped, margin + 34, y);
        y += (wrapped.length - 1) * 10;
      }
      y += 14;
    });
  };
  issueList("Fix now", fix, crit);
  issueList("Watch", watch, warn);

  // ── Per-zone detail table ──
  sectionTitle("Zone detail");
  doc.setFontSize(8.5);
  zones.forEach((z) => {
    ensureSpace(14);
    const statusTxt = z.status.toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ink);
    doc.text(`${String(z.num).padStart(2, "0")}`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...ink);
    doc.text(z.name, margin + 24, y);
    doc.setTextColor(...ink3);
    doc.text(
      `${z.sprinkler} · ${z.plant} · ${z.observations.psi}psi · ${z.observations.gpm}gpm`,
      margin + 180,
      y
    );
    const sc: [number, number, number] =
      z.status === "issues" ? crit : z.status === "pass" ? [60, 140, 90] : ink3;
    doc.setTextColor(...sc);
    doc.text(statusTxt, margin + contentW - 50, y);
    y += 12;
  });

  // Footer page numbers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...ink3);
    doc.text(
      `${site.code} · Wet Check · Page ${p} of ${pages}`,
      margin,
      pageH - 24
    );
  }

  return doc;
}

export function reportFilename(site: Site): string {
  const safeDate = site.date.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "");
  return `WetCheck_${site.code}_${safeDate}.pdf`;
}

/**
 * Share the report via the native share sheet when available (mobile),
 * otherwise download the file (desktop browsers).
 */
export async function shareReport(data: ReportData): Promise<"shared" | "downloaded"> {
  const doc = buildReportPdf(data);
  const filename = reportFilename(data.site);
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({
        files: [file],
        title: `Wet Check — ${data.site.name}`,
        text: `Irrigation wet check report for ${data.site.name} (${data.site.code}).`,
      });
      return "shared";
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }
  doc.save(filename);
  return "downloaded";
}

/** Save the PDF directly (used by "Save draft"). */
export function saveReport(data: ReportData): void {
  const doc = buildReportPdf(data);
  doc.save(reportFilename(data.site));
}
