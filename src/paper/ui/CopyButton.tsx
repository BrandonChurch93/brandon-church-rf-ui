import { useEffect, useRef, useState } from 'react';
import { IconButton } from './IconButton';
import { copyText } from '@/paper/lib/clipboard';
import { toast } from './toastStore';
import { tooltip } from './tooltipStore';

/** Copies a value; the icon morphs to a check and the tooltip reads "Copied" for 1200 ms. */
export function CopyButton({ text, label, className, size = 30 }: { text: string; label: string; className?: string; size?: 30 | 36 }) {
  const [copied, setCopied] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <IconButton
      ref={btn}
      icon={copied ? 'check' : 'copy'}
      label={label}
      tooltipContent={copied ? 'Copied' : label}
      size={size}
      className={className}
      onClick={async (e) => {
        e.stopPropagation();
        const ok = await copyText(text);
        if (ok) {
          setCopied(true);
          if (btn.current) tooltip.show(btn.current, 'Copied', 'top', { immediate: true });
          toast.success(`Copied ${text}`);
        } else toast.danger(`Could not copy ${text}. Select it and copy it by hand.`);
      }}
    />
  );
}
