"use client";

import { ReactNode } from "react";
import { AppErrorBoundary } from "@/components/ErrorBoundary";

interface Props {
  children: ReactNode;
}

export function AppErrorBoundaryWrapper({ children }: Props) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
