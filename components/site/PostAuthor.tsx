function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const picked = parts.slice(-2).map((w) => w[0]);
  return picked.join("").slice(0, 2).toUpperCase() || "?";
}

/** Tên tác giả kèm ảnh đại diện (dùng chữ cái đầu khi chưa có ảnh). */
export default function PostAuthor({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!name) return null;

  const dim =
    size === "sm"
      ? "h-5 w-5 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-base"
        : "h-7 w-7 text-xs";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`avatar ${dim}`} aria-hidden="true">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh đại diện từ liên kết ngoài
          <img src={avatarUrl} alt="" />
        ) : (
          initialsOf(name)
        )}
      </span>
      <span className="font-semibold text-ink">{name}</span>
    </span>
  );
}
