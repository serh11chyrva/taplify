"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { dashboardRequest, requestMessage } from "@/lib/dashboard/request";
import { organizationMediaPath } from "@/lib/dashboard/media";
import { Button } from "@/components/ui/button";

export function ImageUpload({ organizationId, label, value, onChange, onBusy }: {
  organizationId: string;
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const api = organizationMediaPath(organizationId);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const image = input.files?.[0];
    if (!image) return;
    input.value = "";
    setError("");
    if (image.size > 2 * 1024 * 1024) {
      setError("Choose an image up to 2 MiB.");
      return;
    }
    const body = new FormData();
    body.append("image", image);
    setUploading(true);
    onBusy(true);
    try {
      const asset = await dashboardRequest<{ id: string }>(api, { method: "POST", body });
      onChange(asset.id);
    } catch (problem) {
      setError(requestMessage(problem));
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      {value && <div className="flex items-center gap-3">
        <Image unoptimized className="size-14 rounded-md border object-cover" src={`${api}/${value}`} width={56} height={56} alt="Selected image" />
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>Remove image</Button>
      </div>}
      <label className="grid min-w-0 gap-1.5 text-sm">{label}
        <input className="dashboard-input w-full" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
          onChange={(event) => void upload(event)} />
      </label>
      {uploading && <p role="status" className="text-sm text-muted-foreground">Uploading image…</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
