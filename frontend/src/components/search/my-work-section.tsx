"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyWork, type MyWork } from "@/services/search";
import { useAuthStore } from "@/store/auth";

/**
 * "Tugas saya" di beranda sesuai role (US-044): task assignee,
 * follow-up overdue, materi menunggu review, interaksi belum dibalas.
 */
export function MyWorkSection() {
  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);
  const [work, setWork] = useState<MyWork | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    void getMyWork(user).then(({ data }) => {
      if (data) {
        setWork(data);
      }
    });
  }, [user]);

  const sections: { title: string; items: MyWork[keyof MyWork] }[] = work
    ? [
        { title: "Task saya", items: work.tasks },
        { title: "Follow-up overdue", items: work.followUps },
        { title: "Menunggu review", items: work.reviews },
        { title: "SLA komunitas", items: work.sla },
      ]
    : [];
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

  if (!work || total === 0) {
    return null;
  }

  return (
    <section aria-label="Tugas saya" className="grid gap-4 md:grid-cols-2">
      {sections
        .filter((section) => section.items.length > 0)
        .map((section) => (
          <Card key={section.title}>
            <CardHeader className="border-b">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.items.length} item</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {section.items.slice(0, 5).map((item) => (
                  <li key={`${section.title}-${item.id}`}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/50"
                    >
                      {item.urgent ? (
                        <TriangleAlertIcon
                          className="size-4 shrink-0 text-amber-600"
                          aria-label="Mendesak"
                        />
                      ) : null}
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
    </section>
  );
}
