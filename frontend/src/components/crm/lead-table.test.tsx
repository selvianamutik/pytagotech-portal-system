import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { LeadTable } from "@/components/crm/lead-table";
import { mockLeads } from "@/mocks/leads";

describe("LeadTable", () => {
  it("menampilkan baris lead dengan badge status", () => {
    render(<LeadTable leads={mockLeads.slice(0, 2)} onEdit={vi.fn()} />);

    expect(screen.getByText("PT Aruna Digital")).toBeDefined();
    expect(screen.getByText("CV Mandala Kreasi")).toBeDefined();
    expect(screen.getByText("Follow Up")).toBeDefined();
    expect(screen.getByText("Interest")).toBeDefined();
    expect(screen.getByText("LEAD-001")).toBeDefined();
  });
});
