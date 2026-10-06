import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-6 text-center">
      <div>
        <SearchX size={64} className="mx-auto mb-5 text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-ink/50">
          Lỗi 404
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-dark">
          Không tìm thấy trang
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink/70">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển. Bạn có thể quay
          lại trang chủ hoặc xem tin tức mới nhất.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Về trang chủ
          </Link>
          <Link href="/tin-tuc" className="btn btn-ghost">
            Xem tin tức
          </Link>
          <Link href="/lien-he" className="btn btn-ghost">
            Liên hệ
          </Link>
        </div>
      </div>
    </main>
  );
}
