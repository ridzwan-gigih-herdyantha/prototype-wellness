'use client';

import { useEffect, useRef } from 'react';

interface InfiniteSentinelProps {
  onVisible: () => void;
  loading?: boolean;
  /** Changes whenever items are appended, so a still-visible sentinel triggers the next page. */
  itemCount: number;
}

/** Invisible marker at the end of a list; calls onVisible when it scrolls near the viewport. */
export function InfiniteSentinel({ onVisible, loading = false, itemCount }: InfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onVisible);
  callback.current = onVisible;

  useEffect(() => {
    const node = ref.current;
    if (!node || loading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((entry) => entry.isIntersecting)) callback.current(); },
      { rootMargin: '300px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, itemCount]);

  return <div ref={ref} className="h-px" aria-hidden />;
}
