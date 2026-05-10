"use client";

import {
  DEFAULT_PROFILE_IMAGE_PATH,
  PRESET_AVATAR_OPTIONS,
} from "@/lib/profile/preset-avatars";
import { assertAvatarFile } from "@/lib/profile/avatar-upload";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
};

export function SignupAvatarSelector({ disabled = false }: Props) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [presetPath, setPresetPath] = useState(DEFAULT_PROFILE_IMAGE_PATH);
  const [customObjectUrl, setCustomObjectUrl] = useState<string | null>(null);
  const [hasCustomFile, setHasCustomFile] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [brokenPresets, setBrokenPresets] = useState<Set<string>>(() => new Set());
  const [fileHint, setFileHint] = useState<string | null>(null);

  const previewSrc = customObjectUrl ?? presetPath;

  useEffect(() => {
    return () => {
      if (customObjectUrl) URL.revokeObjectURL(customObjectUrl);
    };
  }, [customObjectUrl]);

  const clearCustomFile = useCallback(() => {
    if (customObjectUrl) URL.revokeObjectURL(customObjectUrl);
    setCustomObjectUrl(null);
    setHasCustomFile(false);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
    setFileHint(null);
  }, [customObjectUrl]);

  const applyValidatedFile = useCallback(
    (file: File | null | undefined) => {
      if (!file || file.size === 0) return;
      const checked = assertAvatarFile(file);
      if (!checked.ok) {
        setFileHint(checked.error);
        return;
      }
      setFileHint(null);
      if (customObjectUrl) URL.revokeObjectURL(customObjectUrl);
      const url = URL.createObjectURL(file);
      setCustomObjectUrl(url);
      setHasCustomFile(true);
      const input = fileRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      }
    },
    [customObjectUrl],
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyValidatedFile(e.target.files?.[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    applyValidatedFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const selectPreset = (path: string) => {
    if (disabled) return;
    setPresetPath(path);
    clearCustomFile();
    setPresetModalOpen(false);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#050a14]/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
        Profile picture
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Drop an image, upload your own, or pick a preset. You can change this later in settings.
      </p>

      <div className="mt-5 flex flex-col items-center gap-4">
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={
            "relative flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-[#030810]/80 px-6 py-6 transition " +
            (disabled ? "opacity-50" : "hover:border-cyan-400/35 hover:shadow-[0_0_32px_-12px_rgba(34,211,238,0.25)]")
          }
        >
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-[#0a1428] to-[#050a14] shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)] ring-1 ring-cyan-400/15">
            {customObjectUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob preview
              <img src={previewSrc} alt="" className="h-full w-full object-cover object-center" />
            ) : (
              <Image
                src={previewSrc}
                alt=""
                fill
                className="object-cover object-center"
                sizes="112px"
                priority
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <label
              htmlFor={fileInputId}
              className={
                "cursor-pointer rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 shadow-[0_0_20px_-8px_rgba(34,211,238,0.4)] transition hover:border-cyan-300/55 hover:bg-cyan-500/15 " +
                (disabled ? "pointer-events-none opacity-50" : "")
              }
            >
              Upload image
            </label>
            <input
              ref={fileRef}
              id={fileInputId}
              name="signup_avatar_file"
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              disabled={disabled}
              onChange={onFileInputChange}
            />
            {hasCustomFile ? (
              <button
                type="button"
                disabled={disabled}
                onClick={clearCustomFile}
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                Remove upload
              </button>
            ) : null}
          </div>
          <p className="text-center text-[10px] text-zinc-600">
            JPEG, PNG, WebP · max 2MB
          </p>
        </div>

        {fileHint ? (
          <p className="text-center text-xs text-red-300/95" role="alert">
            {fileHint}
          </p>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={() => setPresetModalOpen(true)}
          className="rounded-lg border border-violet-400/35 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 shadow-[0_0_24px_-10px_rgba(139,92,246,0.45)] transition hover:border-violet-300/50 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Choose from presets
        </button>
      </div>

      <input type="hidden" name="avatar_url" value={presetPath} readOnly />

      {presetModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !disabled && setPresetModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Preset avatars"
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#050a14]/95 shadow-[0_0_60px_-20px_rgba(34,211,238,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                Choose a preset
              </h2>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setPresetModalOpen(false)}
                className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                {PRESET_AVATAR_OPTIONS.filter(({ path }) => !brokenPresets.has(path)).map(
                  ({ path, label }) => {
                    const selected = !hasCustomFile && presetPath === path;
                    return (
                      <button
                        key={path}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectPreset(path)}
                        className={
                          "group flex flex-col items-center gap-2 rounded-xl border p-2 outline-none transition " +
                          (selected
                            ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_24px_-8px_rgba(34,211,238,0.45)]"
                            : "border-white/[0.08] bg-[#030810]/60 hover:border-cyan-400/35 hover:shadow-[0_0_20px_-10px_rgba(34,211,238,0.25)]")
                        }
                      >
                        <span className="relative block aspect-square w-full min-w-0 overflow-hidden rounded-full border border-white/10 bg-[#0a1428]">
                          <Image
                            src={path}
                            alt=""
                            fill
                            className="object-cover object-center transition group-hover:scale-[1.04]"
                            sizes="80px"
                            onError={() =>
                              setBrokenPresets((prev) => new Set(prev).add(path))
                            }
                          />
                        </span>
                        <span className="line-clamp-2 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                          {label}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
