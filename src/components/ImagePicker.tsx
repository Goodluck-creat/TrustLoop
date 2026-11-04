"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { saveImage } from "@/app/actions/profile";

async function toJpeg(file: File, w: number, h: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.max(w / bmp.width, h / bmp.height);
  const sw = w / scale;
  const sh = h / scale;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, w, h);
  for (const q of [0.88, 0.75, 0.6, 0.45]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size < 380_000) return blob;
  }
  throw new Error("too big");
}

export default function ImagePicker({ kind, current }: { kind: "avatar" | "cover"; current: string | null }) {
  const [error, action, pending] = useActionState(saveImage.bind(null, kind), null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const shown = preview ?? current;

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const [w, h] = kind === "avatar" ? [320, 320] : [1400, 420];
      const blob = await toJpeg(f, w, h);
      const dt = new DataTransfer();
      dt.items.add(new File([blob], "image.jpg", { type: "image/jpeg" }));
      if (hidden.current) hidden.current.files = dt.files;
      setPreview(URL.createObjectURL(blob));
      setLocalError(null);
    } catch {
      setLocalError("Could not read that image. Try a JPG or PNG.");
    }
    e.target.value = "";
  }

  return (
    <form action={action} className="space-y-3">
      <div className={`overflow-hidden bg-cream ${kind === "avatar" ? "h-24 w-24 rounded-2xl" : "h-28 w-full rounded-2xl sm:h-36"}`}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted"><ImagePlus className="h-7 w-7" aria-hidden /></div>
        )}
      </div>
      <input ref={hidden} type="file" name="file" className="hidden" tabIndex={-1} aria-hidden />
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-cream focus-within:ring-2 focus-within:ring-forest">
          Choose image
          <input type="file" accept="image/*" onChange={onPick} className="sr-only" />
        </label>
        <button disabled={pending || !preview} className="rounded-xl bg-forest px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
      {(localError || error) && <p role="alert" className="text-sm font-semibold text-rose-700">{localError ?? error}</p>}
    </form>
  );
}