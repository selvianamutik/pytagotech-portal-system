"use client";

import { useCallback, useEffect, useRef } from "react";

type PersistFn<T> = (key: string, value: T) => Promise<{ error: string | null }>;

interface PersistQueueOptions<T> {
  /** Kirim nilai terbaru per `key` ke server. */
  persist: PersistFn<T>;
  /** Durasi diam (idle) sebelum request dikirim. Default 500ms. */
  delay?: number;
  onError?: (error: string) => void;
}

/**
 * Antrean pengiriman ke server dengan debounce + coalescing.
 *
 * Update optimis terjadi di sisi pemanggil (UI langsung berubah tanpa
 * menunggu balasan server). Nilai terbaru per `key` diantrekan dan baru
 * dikirim sekali setelah user diam selama `delay` — gerakan beruntun pada
 * item yang sama digabung menjadi satu request final.
 *
 * Dipakai untuk interaksi seret-and-lepas (pipeline, kalender, board) yang
 * memindahkan status/tanggal secara cepat.
 */
export function usePersistQueue<T>(options: PersistQueueOptions<T>) {
  const { delay = 500 } = options;

  const persistRef = useRef<PersistFn<T> | undefined>(undefined);
  const onErrorRef = useRef<((error: string) => void) | undefined>(undefined);
  const runRef = useRef<(key: string) => void>(() => undefined);

  const latest = useRef(new Map<string, T>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inflight = useRef(new Set<string>());

  // Sinkronkan callback terbaru tanpa menyentuh ref saat render.
  useEffect(() => {
    persistRef.current = options.persist;
    onErrorRef.current = options.onError;
  });

  const run = useCallback((key: string) => {
    timers.current.delete(key);
    if (!latest.current.has(key) || inflight.current.has(key)) {
      return;
    }
    const value = latest.current.get(key) as T;
    latest.current.delete(key);
    inflight.current.add(key);
    const persist = persistRef.current;
    if (persist) {
      void persist(key, value)
        .then(({ error }) => {
          if (error) {
            onErrorRef.current?.(error);
          }
        })
        .finally(() => {
          inflight.current.delete(key);
          // Nilai baru masuk saat request berjalan → kirim lagi.
          if (latest.current.has(key)) {
            runRef.current(key);
          }
        });
    }
  }, []);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const enqueue = useCallback(
    (key: string, value: T) => {
      latest.current.set(key, value);
      const prev = timers.current.get(key);
      if (prev != null) {
        clearTimeout(prev);
      }
      timers.current.set(
        key,
        setTimeout(() => {
          runRef.current(key);
        }, delay)
      );
    },
    [delay]
  );

  const flushAll = useCallback(() => {
    [...timers.current.keys()].forEach((key) => {
      const timer = timers.current.get(key);
      if (timer != null) {
        clearTimeout(timer);
      }
    });
    [...latest.current.keys()].forEach((key) => {
      runRef.current(key);
    });
  }, []);

  const flushAllRef = useRef(flushAll);
  useEffect(() => {
    flushAllRef.current = flushAll;
  }, [flushAll]);

  useEffect(() => {
    const onUnload = () => flushAllRef.current();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      flushAllRef.current();
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  return { enqueue, flushAll };
}