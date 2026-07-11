import { useState } from 'react';
import { FALLBACK_ICONS } from './iconRegistry';

interface ProviderIconProps {
  id: string;
  src: string;
  className?: string;
}

/**
 * Prefers the real file at /public/assets (so swapping in licensed brand
 * assets later is just replacing a file, not touching code). If that file
 * is missing or fails to load, falls back to the inline placeholder icon
 * instead of showing the browser's broken-image glyph.
 */
export function ProviderIcon({ id, src, className }: ProviderIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const Fallback = FALLBACK_ICONS[id];
    return Fallback ? <Fallback className={className} size={20} /> : null;
  }

  return (
    <img
      className={className}
      src={src}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      onError={() => setFailed(true)}
    />
  );
}
