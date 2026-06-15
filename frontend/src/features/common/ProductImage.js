import { useState, useEffect } from 'react';

// 45° hatched placeholder matching the design's image-placeholder treatment.
const HATCH =
  'repeating-linear-gradient(45deg,#1A2540 0,#1A2540 14px,#1D2945 14px,#1D2945 28px)';

/**
 * Renders a product image, falling back to a hatched placeholder when the
 * source is missing or fails to load — so every product always shows an image.
 */
export default function ProductImage({ src, alt, className = '', label = 'no image' }) {
  const [failed, setFailed] = useState(false);

  // Reset the failed flag if the source changes (e.g. list re-renders).
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: HATCH }}
      >
        <span className="rounded-md border border-line-aria bg-background/70 px-2.5 py-1 font-mono text-[10px] text-dim">
          {label}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
