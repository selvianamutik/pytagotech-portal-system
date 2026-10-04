import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { toneClasses } from "@/components/layout/tone-classes";
import type { StatusTone } from "@/types/dashboard";

/** Badge status berwarna konsisten (dipakai beranda dkk.). */
export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <Badge variant="outline" className={toneClasses[tone]}>
      {children}
    </Badge>
  );
}
