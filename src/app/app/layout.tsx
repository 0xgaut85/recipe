import type { Metadata } from "next";
import { AppErrorBoundaryWrapper } from "./error-boundary-wrapper";

export const metadata: Metadata = {
  title: "recipe.money | terminal",
  description: "AI-powered vibetrading terminal on Solana",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <AppErrorBoundaryWrapper>{children}</AppErrorBoundaryWrapper>
    </div>
  );
}
