import HeroSection from "@/components/HeroSection";
import SplitComparisonViewer from "@/components/SplitComparisonViewer";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TimingSection from "@/components/TimingSection";
import YieldCalculator from "@/components/YieldCalculator";
import ComparisonMatrixSection from "@/components/ComparisonMatrixSection";
import ApplicationTechSection from "@/components/ApplicationTechSection";
import EcologySection from "@/components/EcologySection";
import SocialProofSection from "@/components/SocialProofSection";
import FAQAccordion from "@/components/FAQAccordion";
import FooterCTA from "@/components/FooterCTA";
import { SectionReveal } from "@/components/ui/SectionReveal";
import ScrollNavigation from "@/components/ScrollNavigation";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] font-sans antialiased text-[#18181A] selection:bg-[#2D6A4F] selection:text-white">
      <HeroSection />
      <SectionReveal><ProblemSection /></SectionReveal>
      <SplitComparisonViewer />
      <SectionReveal><HowItWorksSection /></SectionReveal>
      <SectionReveal><TimingSection /></SectionReveal>
      <SectionReveal><YieldCalculator /></SectionReveal>
      <SectionReveal><ComparisonMatrixSection /></SectionReveal>
      <SectionReveal><ApplicationTechSection /></SectionReveal>
      <SectionReveal><EcologySection /></SectionReveal>
      <SectionReveal><SocialProofSection /></SectionReveal>
      <SectionReveal><FAQAccordion /></SectionReveal>
      <SectionReveal><FooterCTA /></SectionReveal>
      <ScrollNavigation />
    </main>
  );
}
