"use client";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

import type { ProductionDashboardData } from "@/services/production-dashboard";

/**
 * Ekspor laporan produksi (US-026, FR-20): Excel (SheetJS) dan PDF (jsPDF).
 * Murni client-side dari data dashboard yang tampil (filter ikut serta).
 */

export function buildExcelFile(data: ProductionDashboardData): { blob: Blob; filename: string } {
  const workbook = XLSX.utils.book_new();
  const kpiSheet = XLSX.utils.json_to_sheet([
    { Metrik: "Total Proyek", Nilai: data.kpi.totalProjects },
    { Metrik: "Proyek Aktif", Nilai: data.kpi.activeProjects },
    { Metrik: "Task Selesai", Nilai: data.kpi.tasksDone },
    { Metrik: "Task Berlangsung", Nilai: data.kpi.tasksInProgress },
    { Metrik: "Task Blocked", Nilai: data.kpi.tasksBlocked },
  ]);
  const projectSheet = XLSX.utils.json_to_sheet(
    data.projects.map((row) => ({
      Proyek: row.projectName,
      PM: row.pmName,
      Status: row.status,
      Target: row.targetDate,
      "Progress (%)": row.progress,
      "Hari ke Deadline": row.daysToDeadline,
    }))
  );
  XLSX.utils.book_append_sheet(workbook, kpiSheet, "KPI");
  XLSX.utils.book_append_sheet(workbook, projectSheet, "Proyek");
  const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return {
    blob: new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename: "laporan-produksi.xlsx",
  };
}

export function buildPdfFile(data: ProductionDashboardData): { blob: Blob; filename: string } {
  const document = new jsPDF();
  let y = 16;
  document.setFontSize(16);
  document.text("Laporan Produksi — Pytagotech Portal", 14, y);
  y += 10;
  document.setFontSize(11);
  const lines = [
    `Total Proyek: ${data.kpi.totalProjects}`,
    `Proyek Aktif: ${data.kpi.activeProjects}`,
    `Task Selesai: ${data.kpi.tasksDone}`,
    `Task Berlangsung: ${data.kpi.tasksInProgress}`,
    `Task Blocked: ${data.kpi.tasksBlocked}`,
    "",
    "Proyek:",
  ];
  for (const row of data.projects) {
    lines.push(
      `- ${row.projectName.slice(0, 60)} | ${row.pmName} | ${row.status} | ${row.progress}% | target ${row.targetDate}`
    );
  }
  for (const line of lines) {
    if (y > 280) {
      document.addPage();
      y = 16;
    }
    document.text(line, 14, y);
    y += 7;
  }
  return { blob: document.output("blob"), filename: "laporan-produksi.pdf" };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
