import HeroBanner from "@/components/HeroBanner";
import CommitmentBar from "@/components/CommitmentBar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroBanner />
      <CommitmentBar />
    </div>
  );
}
