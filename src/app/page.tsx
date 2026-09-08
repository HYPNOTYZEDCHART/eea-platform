import HeroSection from "@/components/HeroSection";
import HistorySection from "@/components/HistorySection";
import PillarsSection from "@/components/PillarsSection";
import MembershipCardShowcase from "@/components/MembershipCardShowcase";
import RegistrationTunnel from "@/components/RegistrationTunnel";
import FaqSection from "@/components/FaqSection";

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <HeroSection />
      <HistorySection />
      <PillarsSection />
      <MembershipCardShowcase />
      <RegistrationTunnel />
      <FaqSection />
    </div>
  );
}

