import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}

/** A shimmering placeholder block shown while data loads. Styled by `.metro-skeleton` in the web app's CSS. */
export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  return <span className="metro-skeleton" aria-hidden="true" style={{ width, height, ...style }} />;
}

/** A stack of placeholder cards, e.g. for a list that is still loading. */
export function SkeletonCards({ count = 3, height = 96 }: { count?: number; height?: number }) {
  return (
    <div role="status" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} style={{ borderRadius: 14 }} />
      ))}
    </div>
  );
}
