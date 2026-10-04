import type { Metadata } from "next";

import { InquiryManager } from "@/components/sosmed/inquiry-manager";

export const metadata: Metadata = {
  title: "Inquiry — Pytagotech Portal",
  description: "Inquiry sosmed dan handover WhatsApp ke Sales.",
};

export default function InquiryPage() {
  return <InquiryManager />;
}
