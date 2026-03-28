"use client";

import dynamic from "next/dynamic";

const SplitComparison = dynamic(() => import("@/components/SplitComparison"), { 
  ssr: false, 
  loading: () => <div className="h-[200vh] w-full bg-[#06080b]" />
});

export default function SplitComparisonViewer() {
  return <SplitComparison />;
}
