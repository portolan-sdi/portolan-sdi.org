"use client";

import { SiteShell } from "./site-rail";
import { AboutSection } from "./home/about-section";
import { HeroSection } from "./home/hero-section";
import { ChallengeSection } from "./home/challenge-section";
import { SolutionSection } from "./home/solution-section";
import { WhySection } from "./home/why-section";
import { CaseStudiesSection } from "./home/case-studies-section";
import { NetworkSection } from "./home/network-section";

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

      {/* Three reasons, on a satellite image band. */}
      <WhySection />

      {/* Case studies, one row of cards. */}
      <CaseStudiesSection />

      {/* The registry: the text, and a small map of its coverage. */}
      <NetworkSection />

      {/* Who supports the project, and the way in to the community. */}
      <AboutSection />
    </SiteShell>
  );
}
