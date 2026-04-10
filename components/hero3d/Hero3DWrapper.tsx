"use client";

import dynamic from "next/dynamic";

const Hero3DScene = dynamic(() => import("./Hero3DScene"), {
  ssr: false,
  loading: () => (
    <section className="relative min-h-[100svh] overflow-hidden bg-black flex items-center justify-center" style={{ height: "100svh" }}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg-muted/30 border-t-fg-muted" />
    </section>
  ),
});

interface Hero3DWrapperProps {
  panoramaUrl?: string;
  title?: string;
  subtitle?: string;
  scrollLabel?: string;
}

export default function Hero3DWrapper(props: Hero3DWrapperProps) {
  return <Hero3DScene {...props} />;
}
