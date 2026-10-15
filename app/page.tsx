import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Truck, Dumbbell } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-b from-card-surface via-background to-background border-b border-border">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="container-custom relative z-10 text-center max-w-4xl mx-auto">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-primary mb-6 shadow-sm">
            <Zap size={14} className="text-primary" />
            <span>TITAN ATHLETE COLLECTION 2026 — ĐỈNH CAO THỂ LỰC</span>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
            Bứt Phá Giới Hạn Cùng{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              TITANFIT
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Hệ sinh thái đồ tập Gym, trang phục thể thao hiệu năng cao và thực phẩm bổ
            sung dinh dưỡng thể hình chính hãng hàng đầu Việt Nam.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/do-the-thao"
              className="btn btn-primary h-12 px-8 text-sm font-bold shadow-lg shadow-primary/20 w-full sm:w-auto"
            >
              <Dumbbell size={18} />
              <span>Khám Phá Đồ Thể Thao</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dinh-duong"
              className="btn btn-secondary h-12 px-8 text-sm font-semibold w-full sm:w-auto"
            >
              <span>Dinh Dưỡng &amp; Whey Protein</span>
            </Link>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 pt-12 border-t border-border/60 text-left">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card-surface border border-border/80">
              <ShieldCheck className="text-primary flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  100% Chính Hãng
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đầy đủ tem nhãn, giấy kiểm định thể thao và xuất xứ minh bạch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card-surface border border-border/80">
              <Truck className="text-primary flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Giao Nhanh 2 Giờ
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hỏa tốc nội thành Hà Nội &amp; TP.HCM, đồng kiểm trước khi nhận.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card-surface border border-border/80">
              <Zap className="text-primary flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Đổi Trả 30 Ngày
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bảo hành đường chỉ trọn đời, đổi size miễn phí tận nhà.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
