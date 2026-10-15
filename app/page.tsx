import HeroBanner from "@/components/HeroBanner";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import FeaturedSupplements from "@/components/FeaturedSupplements";
import FeaturedApparel from "@/components/FeaturedApparel";
import CommitmentBar from "@/components/CommitmentBar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroBanner />
      <FlashSaleBanner />
      <FeaturedSupplements />
      <FeaturedApparel />
      <CommitmentBar />
    </div>
  );
}
