import { HeartHandshake, Eye, Target, Gem } from "lucide-react";
import SectionHeading from "./SectionHeading";
import type { AboutContent, TextBlock, ValueItem } from "@/lib/types";

export function AboutSection({
  about,
  id,
}: {
  about: AboutContent;
  id: string;
}) {
  return (
    <section id={id} className="section bg-surface">
      <div className="container-site">
        <div className="grid items-start gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <SectionHeading
              kicker="Giới thiệu"
              title="Tổ chức Dựa vào Cộng đồng CBO Sát Cánh"
              align="left"
            />
            <div className="space-y-4 text-[1.03rem] leading-relaxed text-ink/80">
              {about.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {about.stats.map((stat) => (
              <div
                key={stat.label}
                className="card p-5 text-center"
                style={{ background: "var(--brand-muted)" }}
              >
                <p className="text-2xl font-extrabold text-primary-dark">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm leading-snug text-ink/65">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function VisionMissionValues({
  vision,
  mission,
  values,
}: {
  vision: TextBlock;
  mission: TextBlock;
  values: ValueItem[];
}) {
  const blocks = [
    { ...vision, icon: <Eye size={22} /> },
    { ...mission, icon: <Target size={22} /> },
  ];

  return (
    <section
      id="tam-nhin"
      className="section"
      style={{ background: "var(--brand-muted)" }}
    >
      <div className="container-site">
        <SectionHeading
          kicker="Định hướng"
          title="Tầm nhìn · Sứ mệnh · Giá trị cốt lõi"
          description="Kim chỉ nam cho mọi hoạt động của CBO Sát Cánh."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {blocks.map((block) => (
            <div key={block.heading} className="card p-7">
              <div
                className="mb-4 grid h-12 w-12 place-items-center rounded-2xl text-white"
                style={{ background: "var(--brand-primary)" }}
              >
                {block.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold">{block.heading}</h3>
              <p className="leading-relaxed text-ink/75">{block.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {values.map((value) => (
            <div
              key={value.title}
              className="card flex items-start gap-4 p-7"
              style={{ background: "var(--brand-surface)" }}
            >
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white"
                style={{ background: "var(--brand-dark)" }}
              >
                <Gem size={20} />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold">{value.title}</h3>
                <p className="text-sm leading-relaxed text-ink/70">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ValuesBanner() {
  return (
    <div
      className="mt-8 flex items-center justify-center gap-3 rounded-2xl px-5 py-4 text-center text-sm font-semibold text-white"
      style={{ background: "var(--brand-dark)" }}
    >
      <HeartHandshake size={18} />
      Không kỳ thị — không ai bị bỏ lại phía sau
    </div>
  );
}
