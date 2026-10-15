import React from "react";
import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";

interface CommitmentItem {
  id: string;
  icon: React.ElementType;
  title: string;
  badge: string;
  description: string;
  accentColor: string;
}

const commitments: CommitmentItem[] = [
  {
    id: "authentic",
    icon: ShieldCheck,
    title: "100% Chính Hãng",
    badge: "CAM KẾT VÀNG",
    description: "Đầy đủ tem cào chống giả, hoàn tiền 200% nếu phát hiện hàng nhái.",
    accentColor: "text-primary bg-primary/10 border-primary/20",
  },
  {
    id: "fast-delivery",
    icon: Truck,
    title: "Giao Nhanh 2H",
    badge: "HỎA TỐC",
    description: "Nội thành Hà Nội & TP.HCM nhận trong 2 giờ, hỗ trợ đồng kiểm tận tay.",
    accentColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "easy-return",
    icon: RotateCcw,
    title: "Đổi Trả 7 Ngày",
    badge: "MIỄN PHÍ",
    description: "Hỗ trợ đổi size tận nhà hoàn toàn miễn phí, thủ tục 1 chạm trong 24 giờ.",
    accentColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "free-consulting",
    icon: Headphones,
    title: "Tư Vấn Dinh Dưỡng Free",
    badge: "CHUYÊN GIA 1-1",
    description: "Đội ngũ HLV & Dược sĩ thể thao lên thực đơn và liệu trình Whey tối ưu.",
    accentColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
];

export default function CommitmentBar() {
  return (
    <section
      aria-label="Cam kết dịch vụ TITANFIT"
      className="relative z-20 py-8 lg:py-10 bg-background border-b border-border"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {commitments.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative flex flex-col p-5 rounded-xl bg-card-surface border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Header row: Icon & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${item.accentColor}`}
                  >
                    <Icon size={22} className="stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors uppercase">
                    {item.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-heading text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                {/* Subtle bottom accent line on hover */}
                <div className="absolute bottom-0 left-5 right-5 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
