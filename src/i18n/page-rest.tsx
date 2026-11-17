'use client';

export function Tr({ s }: { s: string }) {
  return <>{s}</>;
}

export function usePageRest() {
  return (s: string) => s;
}
