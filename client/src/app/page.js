import Footer from "@/components/footer";
import FAQ from "@/components/hero/FAQ";
import Features from "@/components/hero/Features";
import LandingPage from "@/components/hero/LandingPage";
import ContactSupport from "@/components/hero/Support";
import WhyChooseUs from "@/components/hero/WhyChooseUs";
import { Working } from "@/components/hero/Working";

export default function Home() {
  return (
    <>
      <LandingPage />
      <Features />
      <Working />
      <WhyChooseUs />
      <ContactSupport />
      <FAQ />
      <Footer />
    </>
  );
}
