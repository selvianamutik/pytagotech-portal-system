import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { CommentSection } from "@/components/collaboration/comment-section";
import { useAuthStore } from "@/store/auth";

beforeEach(() => {
  useAuthStore.setState({
    status: "authenticated",
    user: {
      id: "user-2",
      name: "Feby",
      email: "feby@pytagotech.test",
      roles: ["Sales / Marketing"],
      isActive: true,
      createdAt: "2026-09-01T00:00:00Z",
    },
  });
});

describe("CommentSection", () => {
  it("menampilkan komentar milik entitas saja", async () => {
    render(<CommentSection entityType="lead" entityId="LEAD-001" />);

    // Teks terpecah beberapa <span> karena highlight @mention,
    // sehingga dicocokkan via textContent penuh.
    const byFullText = (_: string, element: Element | null) =>
      element?.textContent ===
      "Sudah follow up via WA, @Dinda minta tolong siapkan deck penawaran.";
    expect(await screen.findByText(byFullText)).toBeDefined();
    // Komentar milik task tidak boleh tampil di lead.
    expect(screen.queryByText(/hero section/)).toBeNull();
  });

  it("menampilkan empty state dan mengirim komentar baru", async () => {
    render(<CommentSection entityType="fitur" entityId="FIT-012" />);

    expect(await screen.findByText(/Belum ada komentar/)).toBeDefined();

    fireEvent.change(screen.getByLabelText("Tulis komentar"), {
      target: { value: "Estimasi 3 hari @Raka" },
    });
    fireEvent.click(screen.getByText("Kirim komentar"));

    const byFullText = (_: string, element: Element | null) =>
      element?.textContent === "Estimasi 3 hari @Raka";
    expect(await screen.findByText(byFullText)).toBeDefined();
  });

  it("menolak submit saat draft kosong", () => {
    render(<CommentSection entityType="fitur" entityId="FIT-012" />);

    expect(screen.getByText("Kirim komentar").closest("button")?.disabled).toBe(true);
  });
});
