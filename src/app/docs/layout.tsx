import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's Recipe? | Documentation",
  description: "Learn about Recipe - The Vibetrading Platform on Solana",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
