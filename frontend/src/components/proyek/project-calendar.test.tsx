import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProjectCalendar } from "@/components/proyek/project-calendar";
import { resetMockFeatures } from "@/services/features";
import { resetMockTasks } from "@/services/tasks";
import { resetMockProjects } from "@/services/projects";
import { resetMockClients } from "@/services/clients";
import { resetMockDeals } from "@/services/deals";

beforeEach(() => {
  // Kalender memakai tanggal hari ini sebagai kursor; kunci ke periode
  // seed agar test tidak bergantung pada tanggal mesin.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  resetMockClients();
  resetMockDeals();
  resetMockProjects();
  resetMockTasks();
  resetMockFeatures();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ProjectCalendar universal", () => {
  it("menampilkan task dan fitur berjadwal lintas proyek", async () => {
    render(<ProjectCalendar />);

    // Entri multi-hari tampil di tiap sel tanggalnya.
    expect((await screen.findAllByText("Desain homepage")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Katalog program")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Form survei")).length).toBeGreaterThan(0);
  });

  it("mode per-proyek memfilter", async () => {
    render(<ProjectCalendar projectId="PRJ-002" />);

    expect((await screen.findAllByText("Copywriting landing")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Desain homepage")).toBeNull();
  });
});
