import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CoreValue } from "@/components/CoreValue";
import { Features } from "@/components/Features";
import { CTA } from "@/components/CTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-white selection:bg-accent-pink selection:text-ink">
      <Header />
      <Hero />
      <CoreValue />
      <Features />
      <CTA />
    </main>
  );
}
