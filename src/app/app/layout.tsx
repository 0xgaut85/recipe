import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Trade | claudetrade",
  description: "AI-powered trading terminal on Solana",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0A0A0A',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      {children}
    </>
  );
}
