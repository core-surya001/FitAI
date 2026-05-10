"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");

  return (
    <main className={`flex-1 w-full relative z-10 ${isAuthPage ? "" : "pt-20"}`}>
      {children}
    </main>
  );
}
