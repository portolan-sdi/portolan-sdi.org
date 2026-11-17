"use client";

import { SiteShell } from "./site-rail";
import { EcosystemSection } from "./ecosystem-section";
import { InvolvedSection } from "./involved-section";
import { GetInvolvedSection } from "./get-involved-section";
import { WhoForSection } from "./who-for-section";
import { CoverageSection } from "./coverage-section";
import { HeroSection } from "./home/hero-section";
import { ChallengeSection } from "./home/challenge-section";
import { SolutionSection } from "./home/solution-section";
import { PracticeSection } from "./home/practice-section";
import { HowSection } from "./home/how-section";

/** The homepage. The sections follow a challenge, solution, impact order. */
export function HomePage() {
  return (
    <SiteShell>
      {/* Hero. The figure beside the headline is the one moving element on
          the page. */}
      <HeroSection />

      {/* The challenge. One of two solid color bands on the page. */}
      <ChallengeSection />

      {/* The solution, on the graph-paper wash. */}
      <SolutionSection />

      {/* What Portolan makes possible, with the cost figure. */}
      <WhoForSection />

      {/* Portolan in practice. The second solid band, in ink. */}
      <PracticeSection />

      {/* Users and supporters. The logo strip follows the practice band, so
          the reader sees who uses Portolan after the examples. */}
      <InvolvedSection />

      {/* Toward a federated network. The coverage map and the IDE Pergamino
          block run full bleed. */}
      <CoverageSection />

      {/* How it works, with the quickstart prompt. */}
      <HowSection />

      {/* Ecosystem. The hero's toolkit link targets this section. */}
      <EcosystemSection />

      {/* Community contribution paths. */}
      <GetInvolvedSection />
    </SiteShell>
  );
}
