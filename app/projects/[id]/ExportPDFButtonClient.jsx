"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowDownToLine } from "lucide-react";

/**
 * ExportPDFButtonClient
 * Props:
 *  - project: { id, name, status, startDate, dueDate, totalAmount, totalCost, profit }
 *  - clientName: string
 *  - assignedUserNames: string[]
 */
export default function ExportPDFButtonClient({
  project,
  clientName,
  assignedUserNames = [],
}) {
  const [loading, setLoading] = useState(false);
  const logoCache = useRef(null);

  // Load /public/logo.png and cache as dataURL
  const loadLogo = async () => {
    if (logoCache.current) return logoCache.current;
    try {
      const res = await fetch("/logo.png");
      if (!res.ok) throw new Error("logo fetch failed");
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      logoCache.current = dataUrl;
      return dataUrl;
    } catch {
      logoCache.current = null;
      return null;
    }
  };

  const handleExport = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 36; // margin

      // Palette (RGB)
      const C = {
        text: [24, 24, 27],
        sub: [100, 116, 139],
        line: [230, 232, 236],
        brand1: [16, 185, 129], // emerald
        brand2: [37, 99, 235],  // blue 600
        chip: [247, 250, 252],
        ok: [16, 185, 129],
        bad: [239, 68, 68],
        grayTrack: [244, 245, 247],
      };

      const fmtCurrency = (n) =>
        Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

      const amount = Number(project.totalAmount || 0);
      const cost = Number(project.totalCost || 0);
      const profit =
        typeof project.profit === "number" ? project.profit : amount - cost;
      const marginPct = amount > 0 ? (profit / amount) * 100 : null;

      const safe = (s) => (s ? String(s) : "—");
      const scheduleStr = `${safe(project.startDate)} to ${safe(project.dueDate)}`;

      const truncate = (text, maxWidth, fontSize = 12, fontStyle = "normal") => {
        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        if (doc.getTextWidth(text) <= maxWidth) return text;
        let out = text;
        const ell = "…";
        while (doc.getTextWidth(out + ell) > maxWidth && out.length) {
          out = out.slice(0, -1);
        }
        return out + ell;
      };

      // HEADER (brand band + white summary card)
      const logo = await loadLogo();
      const drawHeader = () => {
        // dual band (no gradients—PDF safe)
        doc.setFillColor(...C.brand2);
        doc.rect(0, 0, W, 84, "F");
        doc.setFillColor(...C.brand1);
        doc.rect(0, 84, W, 72, "F");

        // brand tile
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, M - 6, 66, 66, 12, 12, "F");
        if (logo) {
          doc.addImage(logo, "PNG", M + 9, M + 3, 48, 48);
        } else {
          // fallback initials
          doc.setTextColor(...C.brand2);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.text("EN", M + 33, M + 36, { align: "center" });
        }

        // brand name + tagline
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Envoy Nexus", M + 86, M + 12);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Projects & Profitability Report", M + 86, M + 32);

        // top-right: status + id
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(safe(project.status)?.toLowerCase(), W - M, M + 10, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`ID: ${safe(project.id)}`, W - M, M + 30, { align: "right" });

        // white card (executive summary)
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, 122, W - 2 * M, 96, 14, 14, "F");
        doc.setDrawColor(...C.line);
        doc.roundedRect(M, 122, W - 2 * M, 96, 14, 14, "S");

        const colW = (W - 2 * M) / 3;
        const labelY = 146;
        const valY = labelY + 21;

        const col = (i, label, value) => {
          const x = M + 18 + i * colW;
          doc.setTextColor(...C.sub);
          doc.setFont("helvetica", "normal"); doc.setFontSize(10);
          doc.text(label, x, labelY);
          doc.setTextColor(...C.text);
          doc.setFont("helvetica", "bold"); doc.setFontSize(14);
          const max = colW - 30;
          doc.text(truncate(value, max, 14, "bold"), x, valY);
        };

        col(0, "Client", safe(clientName));
        col(1, "Schedule", scheduleStr); // ASCII "to" fixes the spacing issue
        col(2, "Status", safe(project.status));
      };

      const drawFooter = (page) => {
        const stamp = new Date().toLocaleString();
        doc.setDrawColor(...C.line);
        doc.line(M, H - M, W - M, H - M);
        doc.setTextColor(...C.sub);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text(`Generated: ${stamp}`, M, H - M + 18);
        doc.text(`Page ${page}`, W - M, H - M + 18, { align: "right" });
      };

      const section = (title, y) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(13);
        doc.setTextColor(...C.text);
        doc.text(title, M, y);
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.8);
        doc.line(M, y + 8, W - M, y + 8);
      };

      // OVERVIEW TABLE
      const overviewTable = (y) => {
        const body = [
          ["Client", safe(clientName)],
          ["Dates", scheduleStr],
          ["Assigned", assignedUserNames.length ? assignedUserNames.join(", ") : "—"],
          ["Status", safe(project.status)],
        ];
        autoTable(doc, {
          startY: y,
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: 10,
            textColor: C.text,
            cellPadding: 8,
            lineWidth: 0.2,
            lineColor: C.line,
          },
          headStyles: {
            fillColor: [250, 250, 250],
            textColor: [71, 85, 105],
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 140, textColor: [71, 85, 105], fontStyle: "bold" },
            1: { cellWidth: W - 2 * M - 140 },
          },
          body,
          margin: { left: M, right: M },
          tableWidth: W - 2 * M,
          didDrawPage: (data) => {
            if (data.pageNumber === 1) drawHeader();
            drawFooter(data.pageNumber);
          },
        });
      };

      // FINANCIALS CARD
      const financials = (y) => {
        const cardH = 110;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, y, W - 2 * M, cardH, 12, 12, "F");
        doc.setDrawColor(...C.line);
        doc.roundedRect(M, y, W - 2 * M, cardH, 12, 12, "S");

        const colW = (W - 2 * M) / 3;
        const y0 = y + 26;

        const metric = (i, label, value, color) => {
          const x = M + 18 + i * colW;
          doc.setTextColor(...C.sub);
          doc.setFont("helvetica", "normal"); doc.setFontSize(10);
          doc.text(label, x, y0);
          doc.setTextColor(...C.text);
          doc.setFont("helvetica", "bold"); doc.setFontSize(16);
          doc.text(value, x, y0 + 24);
          doc.setDrawColor(...color);
          doc.setLineWidth(2.4);
          doc.line(x, y0 + 31, x + 72, y0 + 31);
        };

        metric(0, "Amount", fmtCurrency(amount), C.brand2);
        metric(1, "Cost", fmtCurrency(cost), [107, 114, 128]);
        metric(2, "Profit", fmtCurrency(profit), profit >= 0 ? C.ok : C.bad);

        const barY = y + 76;
        const barW = W - 2 * M - 36;
        doc.setFillColor(...C.grayTrack);
        doc.roundedRect(M + 18, barY, barW, 10, 5, 5, "F");

        if (marginPct !== null) {
          const pct = Math.max(0, Math.min(100, marginPct));
          const fillW = (barW * pct) / 100;
          doc.setFillColor(...(profit >= 0 ? C.ok : C.bad));
          doc.roundedRect(M + 18, barY, fillW, 10, 5, 5, "F");

          doc.setTextColor(...C.sub);
          doc.setFont("helvetica", "normal"); doc.setFontSize(10);
          doc.text(`${Math.round(pct)}% margin`, M + 18 + barW, barY + 24, { align: "right" });
        }
      };

      // TEAM TABLE
      const teamTable = (y) => {
        const body =
          assignedUserNames.length > 0
            ? assignedUserNames.map((n, i) => [String(i + 1), n])
            : [["—", "No users assigned"]];
        autoTable(doc, {
          startY: y,
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: 10,
            textColor: C.text,
            cellPadding: 8,
            lineWidth: 0.2,
            lineColor: C.line,
          },
          head: [["#", "Member"]],
          headStyles: {
            fillColor: [250, 250, 250],
            textColor: [71, 85, 105],
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 40, halign: "center", fontStyle: "bold" },
            1: { cellWidth: W - 2 * M - 40 },
          },
          margin: { left: M, right: M },
          tableWidth: W - 2 * M,
          didDrawPage: (data) => {
            if (data.pageNumber === 1) drawHeader();
            drawFooter(data.pageNumber);
          },
        });
      };

      // PAGE 1
      section("Overview", 242);
      overviewTable(262);

      let y = (doc.lastAutoTable?.finalY || 262) + 28;
      section("Financials", y);
      financials(y + 14);

      // PAGE 2 (if needed)
      y = y + 14 + 110 + 32;
      if (y > H - 180) {
        doc.addPage();
        drawFooter(doc.internal.getNumberOfPages());
        y = M + 24;
      }
      section("Team", y);
      teamTable(y + 14);

      drawFooter(doc.internal.getNumberOfPages());
      doc.save(`${safe(project.id)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      title="Export as PDF"
    >
      <ArrowDownToLine className="h-4 w-4" />
      {loading ? "Generating…" : "Export PDF"}
    </button>
  );
}
