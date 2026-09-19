"use client";

import { useState } from "react";

type CopyReferralButtonProps = {
  value: string;
  label?: string;
};

export default function CopyReferralButton({
  value,
  label = "Copier",
}: CopyReferralButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
    >
      {copied ? "Copié ✓" : label}
    </button>
  );
}