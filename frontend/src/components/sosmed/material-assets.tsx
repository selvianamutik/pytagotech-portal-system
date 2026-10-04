"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  linkAssetsToMaterial,
  listAssetsWithStatus,
  type AssetWithStatus,
} from "@/services/assets";

/**
 * Tautkan aset ke materi (US-034, FR-27): hanya aset yang belum
 * kedaluwarsa yang bisa dipilih.
 */
export function MaterialAssets({
  materialId,
  linkedAssetIds,
  onChanged,
}: {
  materialId: string;
  linkedAssetIds: string[];
  onChanged: () => void;
}) {
  const [assets, setAssets] = useState<AssetWithStatus[]>([]);
  const [selected, setSelected] = useState<string[]>(linkedAssetIds);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listAssetsWithStatus().then(({ data }) => {
      if (!cancelled && data) {
        setAssets(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setPending(true);
    setError(null);
    const { error: linkError } = await linkAssetsToMaterial(materialId, selected);
    setPending(false);
    if (linkError) {
      setError(linkError);
      return;
    }
    onChanged();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Aset tertaut</CardTitle>
        <CardDescription>
          Aset kedaluwarsa tidak dapat dipilih.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {assets.map((asset) => (
          <label
            key={asset.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${asset.expired ? "opacity-50" : ""}`}
          >
            <input
              type="checkbox"
              className="size-4 accent-primary"
              disabled={asset.expired}
              checked={selected.includes(asset.id)}
              onChange={(event) => {
                if (event.target.checked) {
                  setSelected((previous) => [...previous, asset.id]);
                } else {
                  setSelected((previous) => previous.filter((id) => id !== asset.id));
                }
              }}
            />
            <span className="font-medium">{asset.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{asset.id}</span>
            {asset.expired ? (
              <span className="text-xs text-destructive">kedaluwarsa</span>
            ) : null}
          </label>
        ))}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="button" size="sm" disabled={pending} onClick={() => void handleSave()}>
          {pending ? "Menyimpan..." : "Simpan tautan"}
        </Button>
      </CardContent>
    </Card>
  );
}
