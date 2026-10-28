import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LeadActivityDialog } from "@/components/crm/lead-activity-dialog";
import { resetMockAudit } from "@/services/audit";
import { getLead } from "@/services/leads";
import { resetMockLeadActivities } from "@/services/lead-activities";

beforeEach(() => {
  resetMockLeadActivities();
  resetMockAudit();
});

describe("LeadActivityDialog — ubah status", () => {
  it("memindahkan status dan mencatat timeline", async () => {
    const lead = (await getLead("LEAD-003")).data!;
    expect(lead.status).toBe("New");

    render(
      <LeadActivityDialog
        lead={lead}
        open
        onOpenChange={() => {}}
        onChanged={() => {}}
      />
    );

    expect(await screen.findByText("Status:")).toBeDefined();
    expect(screen.getByText("New")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Ubah ke status"), {
      target: { value: "Contacted" },
    });
    fireEvent.click(screen.getByText("Ubah status"));

    await waitFor(() => {
      expect(screen.queryByText("Ubah status")).toBeNull();
    });
    expect((await getLead("LEAD-003")).data?.status).toBe("Contacted");
    expect(await screen.findByText(/New → Contacted/)).toBeDefined();
  });
});
