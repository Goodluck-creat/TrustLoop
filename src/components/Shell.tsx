import type { ReactNode } from "react";
import AppNav from "@/components/AppNav";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B0B2B] text-white">
      <div className="tl-aurora pointer-events-none -left-32 top-0 h-96 w-96 bg-violet-600" />
      <div className="tl-aurora pointer-events-none right-[-6rem] top-1/3 h-[26rem] w-[26rem] bg-fuchsia-500 [animation-delay:-6s]" />
      <div className="tl-aurora pointer-events-none bottom-0 left-1/4 h-96 w-96 bg-cyan-500 [animation-delay:-11s]" />
      <AppNav />
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}