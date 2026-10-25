import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Nav } from "@/components/bmw/Nav";
import { Contact } from "@/components/bmw/Contact";

const Experience = lazy(() => import("@/components/bmw/Experience"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BMW M4 Competition xDrive — Vantage Motors" },
      { name: "description", content: "A cinematic, scroll-driven 3D presentation of the BMW M4 Competition xDrive. Book a private viewing at Vantage Motors." },
      { property: "og:title", content: "BMW M4 Competition xDrive — Vantage Motors" },
      { property: "og:description", content: "Explore the BMW M4 Competition xDrive in interactive 3D and book a private viewing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Placeholder() {
  return <div className="h-[820vh] bg-background" />;
}

function Index() {
  return (
    <main className="bg-background text-foreground">
      <Nav />
      <ClientOnly fallback={<Placeholder />}>
        <Suspense fallback={<Placeholder />}>
          <Experience />
        </Suspense>
      </ClientOnly>
      <Contact />
    </main>
  );
}
