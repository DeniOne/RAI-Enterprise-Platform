"use client";

import dynamic from "next/dynamic";

const SplitComparison = dynamic(() => import("@/components/SplitComparison"), { 
  ssr: false, 
  loading: () => (
    <div className="relative h-screen w-full overflow-hidden bg-[#06080b]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_48%,rgba(205,255,0,0.14),transparent_26%),linear-gradient(135deg,#06080b_0%,#101814_45%,#06080b_100%)]" />
      <div className="absolute inset-y-0 left-[68%] w-px bg-[#CDFF00] shadow-[0_0_24px_4px_#CDFF00]" />
    </div>
  )
});

export default function SplitComparisonViewer() {
  return <SplitComparison />;
}
