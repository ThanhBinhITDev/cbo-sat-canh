"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { CATEGORY_LABELS, type PostCategory } from "@/lib/types";

/** Từ khóa gợi ý sẵn (pill buttons). */
const SUGGESTIONS = [
  "Xét nghiệm HIV",
  "PrEP",
  "PEP",
  "ARV",
  "Tư vấn",
  "Hoạt động cộng đồng",
  "Thiện nguyện",
];

type Result = { slug: string; title: string; category: PostCategory };

function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value as PostCategory] ?? "Tin tức";
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-line bg-muted px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink/70">
      {children}
    </kbd>
  );
}

/** Modal chỉ mount khi mở → trạng thái luôn mới, không cần reset trong effect. */
export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <SearchDialog onClose={onClose} />;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  /** Từ khóa đã có kết quả trả về — dùng để biết đang tải hay đã xong. */
  const [fetchedTerm, setFetchedTerm] = useState("");
  const [active, setActive] = useState(0);

  const term = query.trim();
  const pending = term.length > 0 && fetchedTerm !== term;

  // Tự focus ô nhập + khoá cuộn nền (đồng bộ với hệ thống ngoài).
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  // Truy vấn có debounce. Mọi setState nằm trong callback async (không đồng bộ trong effect).
  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(Array.isArray(data.items) ? (data.items as Result[]) : []);
        setActive(0);
      } catch {
        // bỏ qua (abort / lỗi mạng) — vẫn cho Enter tìm toàn bộ
        setResults([]);
      } finally {
        setFetchedTerm(term);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const runQuery = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      go(`/tin-tuc?q=${encodeURIComponent(q)}`);
    },
    [go],
  );

  // Điều hướng bàn phím.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (!results.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        const item = results[active];
        if (item) {
          e.preventDefault();
          go(`/tin-tuc/${item.slug}`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, active, onClose, go]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-[10vh] sm:pt-[13vh]"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.5)]">
        {/* 1. Đầu: ô nhập + gợi ý */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runQuery(term);
          }}
          className="border-b border-line p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-muted px-4 py-3 transition focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
            <Search size={20} className="shrink-0 text-primary" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm bài viết, dịch vụ, hoạt động..."
              aria-label="Từ khóa tìm kiếm"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-base text-ink caret-primary outline-none placeholder:text-ink/45"
            />
            <button
              type="button"
              onClick={onClose}
              className="hidden shrink-0 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-bold tracking-wide text-ink/60 transition hover:border-primary hover:text-primary sm:block"
            >
              ESC
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink/45">
              Gợi ý:
            </span>
            {SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => runQuery(tag)}
                className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-primary-dark transition hover:border-primary hover:bg-primary/5"
              >
                {tag}
              </button>
            ))}
          </div>
        </form>

        {/* 2. Thân: trạng thái trống / kết quả */}
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {!term ? (
            <div className="grid place-items-center gap-3 px-6 py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <Search size={30} aria-hidden />
              </span>
              <p className="text-lg font-extrabold text-primary-dark">
                Bạn muốn tìm gì?
              </p>
              <p className="max-w-sm text-sm text-ink/55">
                Nhập từ khóa hoặc chọn gợi ý bên trên để tìm tin tức, hoạt động và
                dịch vụ của CBO Sát Cánh.
              </p>
            </div>
          ) : pending ? (
            <p className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-ink/55">
              <Loader2 size={16} className="animate-spin" /> Đang tìm...
            </p>
          ) : results.length === 0 ? (
            <div className="grid place-items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-ink/70">
                Không có kết quả cho “{term}”.
              </p>
              <button
                type="button"
                onClick={() => runQuery(term)}
                className="rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                Xem tất cả kết quả
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((item, i) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(`/tin-tuc/${item.slug}`)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      i === active ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Search
                      size={16}
                      className={`shrink-0 ${i === active ? "text-primary" : "text-ink/35"}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {item.title}
                      </span>
                      <span className="block text-xs text-ink/50">
                        {categoryLabel(item.category)}
                      </span>
                    </span>
                    <CornerDownLeft
                      size={15}
                      className={`shrink-0 ${i === active ? "text-primary" : "text-ink/25"}`}
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Chân: phím tắt + thương hiệu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[11px] text-ink/55 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="flex items-center gap-1.5">
              <Kbd>
                <ArrowUp size={11} />
              </Kbd>
              <Kbd>
                <ArrowDown size={11} />
              </Kbd>
              để di chuyển
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>
                <CornerDownLeft size={11} />
              </Kbd>
              để chọn
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>ESC</Kbd>
              để đóng
            </span>
          </div>
          <span className="font-semibold tracking-wide text-ink/40">
            Kaliva Search
          </span>
        </div>
      </div>
    </div>
  );
}
