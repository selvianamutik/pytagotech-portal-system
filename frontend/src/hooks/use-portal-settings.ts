"use client";

import { useCallback, useEffect, useState } from "react";

import { getPortalSettings } from "@/services/settings";
import type { PortalSettings } from "@/types/settings";
import { DEFAULT_PORTAL_SETTINGS } from "@/types/settings";

interface UsePortalSettingsResult {
  /** Nilai default langsung tersedia; diganti data database setelah dimuat. */
  settings: PortalSettings;
  loading: boolean;
  error: string | null;
  /** Muat ulang setelah pengaturan diubah dari halaman Pengaturan. */
  reload: () => void;
}

/**
 * Hook pengaturan operasional (US-041, FR-30). Dipakai modul yang butuh SLA,
 * target KPI, nomor WhatsApp, atau kalender libur agar tidak hardcode.
 */
export function usePortalSettings(): UsePortalSettingsResult {
  const [settings, setSettings] = useState<PortalSettings>(() => ({
    ...DEFAULT_PORTAL_SETTINGS,
    serviceHours: {
      ...DEFAULT_PORTAL_SETTINGS.serviceHours,
      days: [...DEFAULT_PORTAL_SETTINGS.serviceHours.days],
    },
    waNumbers: { ...DEFAULT_PORTAL_SETTINGS.waNumbers },
    kpiTargets: {},
    holidays: [],
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getPortalSettings()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.data) {
          setSettings(result.data);
        }
        setError(result.error);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Pengaturan belum bisa dimuat; memakai nilai bawaan.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { settings, loading, error, reload };
}
