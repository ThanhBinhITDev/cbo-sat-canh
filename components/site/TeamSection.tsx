import Image from "next/image";
import { UserRound } from "lucide-react";
import SectionHeading from "./SectionHeading";
import type { TeamMember } from "@/lib/types";

export default function TeamSection({ members }: { members: TeamMember[] }) {
  if (!members.length) return null;

  return (
    <section id="doi-ngu" className="section" style={{ background: "var(--brand-muted)" }}>
      <div className="container-site">
        <SectionHeading
          kicker="Đội ngũ"
          title="Những người đồng hành"
          description="Cán bộ, nhân viên và cộng tác viên tận tâm của CBO Sát Cánh."
        />

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {members.map((member) => (
            <article key={member.id} className="card card-hover p-5 text-center">
              <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-muted">
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.full_name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-primary">
                    <UserRound size={38} />
                  </div>
                )}
              </div>
              <h3 className="text-base font-bold leading-snug">
                {member.full_name}
              </h3>
              {member.position && (
                <p className="mt-0.5 text-sm text-primary">{member.position}</p>
              )}
              {member.bio && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink/65">
                  {member.bio}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
