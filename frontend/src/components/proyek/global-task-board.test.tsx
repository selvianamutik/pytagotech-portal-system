import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { GlobalTaskBoard } from "@/components/proyek/global-task-board";
import { resetMockClients } from "@/services/clients";
import { resetMockDeals } from "@/services/deals";
import { resetMockFeatures } from "@/services/features";
import { resetMockProjects } from "@/services/projects";
import { resetMockTasks } from "@/services/tasks";

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockProjects();
  resetMockTasks();
  resetMockFeatures();
});

describe("GlobalTaskBoard", () => {
  it("menampilkan task lintas proyek per kolom status", async () => {
    render(<GlobalTaskBoard />);

    expect(await screen.findByText("Desain homepage")).toBeDefined();
    expect(await screen.findByText("Copywriting landing")).toBeDefined();
    expect(screen.getByText("Task Board")).toBeDefined();
  });
});
