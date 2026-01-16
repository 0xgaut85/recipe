import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | CLAUDE TRADE",
  description:
    "Learn how to use Claude Trade - the AI-powered trading platform on Solana.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
