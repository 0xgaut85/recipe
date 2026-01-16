import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CoreValue } from "@/components/CoreValue";
import { Features } from "@/components/Features";
import { CTA } from "@/components/CTA";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#F7F7F7" }}>
      <Header />
      <div style={{ paddingTop: "100px" }}>
        <Hero />
        <CoreValue />
        <Features />
        <CTA />
      </div>
    </main>
  );
}
