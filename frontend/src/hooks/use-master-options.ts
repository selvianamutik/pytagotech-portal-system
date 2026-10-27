"use client";

import { useEffect, useState } from "react";

import { getActiveMasterOptions } from "@/services/master-data";
import type { MasterOptionsByCategory } from "@/types/master-data";
import { fallbackMasterOptions } from "@/types/master-data";

interface UseMasterOptionsResult {
  /** Opsi aktif per kategori; langsung berisi nilai cadangan saat memuat. */
  options: MasterOptionsByCategory;
  loading: boolean;
  error: string | null;
}

/**
 * Hook dropdown terpusat (US-005, AC2). Membaca `master_options` aktif dari
 * Supabase saat komponen dipasang; bila database belum bisa diakses, daftar
 * cadangan dipakai agar form demo tetap berfungsi.
 */
export function useMasterOptions(): UseMasterOptionsResult {
  const [options, setOptions] = useState<MasterOptionsByCategory>(() =>
    fallbackMasterOptions()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getActiveMasterOptions()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.data) {
          setOptions(result.data);
        }
        setError(result.error);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Master data belum bisa dimuat; memakai daftar bawaan.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, error };
}
