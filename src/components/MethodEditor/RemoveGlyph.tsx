interface RemoveGlyphProps {
  size?: number;
}

/**
 * A plain, self-contained X glyph (two crossing lines, no external icon
 * package dependency) used specifically for chip "remove" buttons. If a
 * remove button's icon has ever appeared to be missing, this rules out
 * anything specific to how lucide-react's <X /> loads or sizes itself.
 */
export function RemoveGlyph({ size = 12 }: RemoveGlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 2L10 10M10 2L2 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
