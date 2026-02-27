"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

const WORKBENCH_PATHS = ["/", "/project", "/motion", "/ebooks", "/materials", "/settings"];

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isWorkbench =
    pathname === "/" ||
    WORKBENCH_PATHS.some((p) => p !== "/" && pathname.startsWith(p));
  if (isWorkbench) return null;
  return <Header />;
}
