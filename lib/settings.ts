import { createClient } from "@/lib/supabase/server";
import { DEFAULT_HOTLINE, SITE_URL } from "@/lib/env";
import type {
  AboutContent,
  ContactInfo,
  HeroContent,
  MapContent,
  TextBlock,
  ValueItem,
} from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Nội dung tĩnh mặc định — lấy nguyên văn từ file Word.
 * Khi chưa cấu hình Supabase, trang vẫn hiển thị đủ nội dung.
 * ------------------------------------------------------------------ */

export const DEFAULT_HERO: HeroContent = {
  badge: "Thành lập 04/12/2022",
  title: "Cùng Sát Cánh nâng cao sức khỏe cộng đồng",
  subtitle:
    "Tổ chức Dựa vào Cộng đồng CBO Sát Cánh đồng hành cùng mọi người trong chăm sóc sức khỏe, phòng chống HIV/AIDS và thiện nguyện xã hội — không kỳ thị, không ai bị bỏ lại phía sau.",
  image: null,
  cta_label: "Nhận tư vấn miễn phí",
  cta_href: "/lien-he",
};

export const DEFAULT_ABOUT: AboutContent = {
  paragraphs: [
    "Tổ chức Dựa vào Cộng đồng CBO Sát Cánh được thành lập ngày 04/12/2022, hoạt động trong lĩnh vực y tế cộng đồng và thiện nguyện xã hội. Với tinh thần sẻ chia, trách nhiệm và nhân ái, CBO Sát Cánh luôn nỗ lực kết nối nguồn lực, đồng hành cùng cộng đồng trong công tác chăm sóc sức khỏe, phòng chống HIV/AIDS, hỗ trợ những người có hoàn cảnh khó khăn và lan tỏa những giá trị tích cực đến xã hội.",
    "CBO Sát Cánh tin rằng mỗi hành động yêu thương, dù nhỏ bé, đều có thể tạo nên những thay đổi ý nghĩa cho cộng đồng.",
  ],
  stats: [
    { value: "04/12/2022", label: "Ngày thành lập" },
    { value: "04", label: "Dịch vụ y tế cộng đồng" },
    { value: "10+", label: "Đối tác chiến lược" },
    { value: "03", label: "Giá trị cốt lõi đồng hành" },
  ],
};

export const DEFAULT_VISION: TextBlock = {
  heading: "Tầm nhìn",
  body: "Tổ chức hoạt động hiệu quả, uy tín và bền vững trong lĩnh vực y tế cộng đồng và thiện nguyện xã hội; góp phần xây dựng một cộng đồng khỏe mạnh, bình đẳng, nhân ái, không kỳ thị và không ai bị bỏ lại phía sau.",
};

export const DEFAULT_MISSION: TextBlock = {
  heading: "Sứ mệnh",
  body: "Nâng cao sức khỏe cộng đồng, đồng hành cùng người yếu thế và lan tỏa yêu thương thông qua các hoạt động y tế và thiện nguyện xã hội.",
};

export const DEFAULT_VALUES: ValueItem[] = [
  {
    title: "Lắng nghe, đồng hành",
    description:
      "Chúng tôi lắng nghe từng câu chuyện và đi cùng bạn trên suốt hành trình, không phán xét.",
  },
  {
    title: "Quan tâm, thấu hiểu",
    description:
      "Thấu cảm hoàn cảnh của mỗi người để đưa ra sự hỗ trợ đúng lúc, đúng cách.",
  },
];

export const DEFAULT_CONTACT: ContactInfo = {
  hotline: ["0967.206.095", "0396.433.095"],
  email: "satcanhkg68@gmail.com",
  fanpage: "CBO SÁT CÁNH",
  fanpage_url: "https://www.facebook.com/",
  zalo: "0967206095",
  address: "",
  working_hours: "Thứ 2 – Chủ nhật: 08:00 – 17:00",
};

export const DEFAULT_MAP: MapContent = {
  embed: "",
  address: DEFAULT_CONTACT.address,
};

export const DEFAULT_FOOTER = {
  slogan:
    "Mỗi hành động yêu thương, dù nhỏ bé, đều có thể tạo nên những thay đổi ý nghĩa cho cộng đồng.",
  copyright: "© 2026 Tổ chức Dựa vào Cộng đồng CBO Sát Cánh.",
};

export const DEFAULT_SEO = {
  title: "CBO Sát Cánh — Y tế cộng đồng & thiện nguyện xã hội",
  description:
    "CBO Sát Cánh: xét nghiệm nhanh HIV/STIs, PrEP, PEP, chuyển gửi điều trị ARV. Đồng hành cùng cộng đồng khỏe mạnh, bình đẳng, nhân ái.",
};

/* ------------------------------------------------------------------ */

type SettingsMap = Record<string, unknown>;

let cache: { data: SettingsMap; at: number } | null = null;
const TTL_MS = 60_000;

export async function getSettings(): Promise<SettingsMap> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const supabase = await createClient();
  if (!supabase) {
    cache = { data: {}, at: Date.now() };
    return {};
  }

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value");

    if (error || !data) {
      cache = { data: {}, at: Date.now() };
      return {};
    }

    const map: SettingsMap = {};
    for (const row of data) map[row.key] = row.value;
    cache = { data: map, at: Date.now() };
    return map;
  } catch {
    return {};
  }
}

export function invalidateSettingsCache() {
  cache = null;
}

function pick<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object") return value as T;
  return fallback;
}

export async function getContent() {
  const s = await getSettings();

  return {
    hero: pick<HeroContent>(s.hero, DEFAULT_HERO),
    about: pick<AboutContent>(s.about, DEFAULT_ABOUT),
    vision: pick<TextBlock>(s.vision, DEFAULT_VISION),
    mission: pick<TextBlock>(s.mission, DEFAULT_MISSION),
    values: Array.isArray(s.values) && s.values.length
      ? (s.values as ValueItem[])
      : DEFAULT_VALUES,
    contact: pick<ContactInfo>(s.contact, {
      ...DEFAULT_CONTACT,
      hotline: DEFAULT_HOTLINE.match(/\d+/g)
        ? formatHotline(DEFAULT_HOTLINE)
        : DEFAULT_CONTACT.hotline,
    }),
    map: pick<MapContent>(s.map, DEFAULT_MAP),
    footer: pick(DEFAULT_FOOTER, DEFAULT_FOOTER),
    seo: pick(s.seo, DEFAULT_SEO),
  };
}

export function formatHotline(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 10) return [raw];
  return [raw.slice(0, raw.length / 2), raw.slice(raw.length / 2)].map((x) =>
    x.trim(),
  );
}

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
