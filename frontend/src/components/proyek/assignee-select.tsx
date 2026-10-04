"use client";

import { useEffect, useState } from "react";

import { listDeveloperNames } from "@/services/developers";

/**
 * Dropdown penanggung jawab dari master data developer
 * (permintaan pemilik). Opsi kosong = tanpa assignee.
 */
export function AssigneeSelect({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listDeveloperNames().then(({ data }) => {
      if (!cancelled && data) {
        setNames(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">Tanpa penanggung jawab</option>
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
