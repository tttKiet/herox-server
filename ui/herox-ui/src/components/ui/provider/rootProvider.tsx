"use client";

import ParticlesBackground from "@/components/animation/ParticlesBackground";

function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParticlesBackground className="h-full w-full absolute inset-0 -z-10" />
      <div className="flex justify-center">{children}</div>
    </>
  );
}

export default RootProvider;
