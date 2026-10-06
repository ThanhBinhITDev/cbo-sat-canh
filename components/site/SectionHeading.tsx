export default function SectionHeading({
  kicker,
  title,
  description,
  align = "center",
}: {
  kicker?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`mb-10 max-w-3xl ${
        align === "center" ? "mx-auto text-center" : "text-left"
      }`}
    >
      {kicker && <span className="section-kicker">{kicker}</span>}
      <h2 className="section-title">{title}</h2>
      {description && (
        <p className="mt-3 text-[1.02rem] leading-relaxed text-ink/70">
          {description}
        </p>
      )}
    </div>
  );
}
