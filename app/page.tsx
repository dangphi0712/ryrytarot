import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import DeckExplorer from "@/components/DeckExplorer";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <main className="container py-4 py-md-5" style={{ maxWidth: 900 }}>
        <section id="decks" className="mb-5" style={{ scrollMarginTop: 80 }}>
          <h2 className="h4 tarot-title fw-bold text-center mb-4">Khám phá bộ bài</h2>
          <DeckExplorer />
        </section>
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
