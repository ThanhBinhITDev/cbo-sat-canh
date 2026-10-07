-- ============================================================
-- CBO Sát Cánh — dữ liệu mẫu (seed)
-- Chạy SAU khi đã chạy migrations. Có thể chạy lại được (upsert).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Dịch vụ (4)
-- ------------------------------------------------------------
insert into public.services (id, title, slug, description, icon, color, sort_order, is_active) values
  ('00000000-0000-0000-0000-000000000001',
   'Xét nghiệm nhanh HIV/STIs', 'xet-nghiem-nhanh-hiv-stis',
   'Xét nghiệm nhanh, bảo mật và miễn phí tại cộng đồng — cho kết quả trong vài phút với sự tư vấn tận tâm.',
   'test-tube', '#279CD7', 1, true),
  ('00000000-0000-0000-0000-000000000002',
   'Dự phòng trước phơi nhiễm HIV (PrEP)', 'prep',
   'Tư vấn và cấp thuốc PrEP giúp giảm nguy cơ lây nhiễm HIV, bảo vệ bạn và người thân.',
   'shield-check', '#1C4592', 2, true),
  ('00000000-0000-0000-0000-000000000003',
   'Dự phòng sau phơi nhiễm HIV (PEP)', 'pep',
   'Can thiệp khẩn cấp trong vòng 72 giờ sau phơi nhiễm — hãy gọi ngay cho chúng tôi.',
   'clock-alert', '#EF4444', 3, true),
  ('00000000-0000-0000-0000-000000000004',
   'Chuyển gửi điều trị HIV (ARV)', 'chuyen-gui-dieu-tri-arv',
   'Kết nối bạn đến cơ sở điều trị ARV uy tín, đồng hành cùng bạn trong suốt lộ trình điều trị.',
   'heart-pulse', '#10B981', 4, true)
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ------------------------------------------------------------
-- 2. Nhóm đối tác (3)
-- ------------------------------------------------------------
insert into public.partner_groups (key, label, title, subtitle, sort_order) values
  ('strategic', 'Đối tác chiến lược', 'Đối tác chiến lược chính',
   'Nền tảng thành công của CBO SÁT CÁNH', 1),
  ('clinic', 'Phòng khám', 'Phòng khám Nhà Mình', null, 2),
  ('network', 'Mạng lưới CBO', 'Mạng lưới CBO Đồng bằng Sông Cửu Long', null, 3)
on conflict (key) do update set
  label = excluded.label,
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ------------------------------------------------------------
-- 3. Đối tác (10) — logo lấy từ thư mục public/images/partners/
-- ------------------------------------------------------------
insert into public.partners (id, name, "group", logo_url, website_url, sort_order, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'Đối tác chiến lược 1', 'strategic', '/images/partners/doi-tac-01.jpg', null, 1, true),
  ('00000000-0000-0000-0000-000000000002', 'Đối tác chiến lược 2', 'strategic', '/images/partners/doi-tac-02.jpg', null, 2, true),
  ('00000000-0000-0000-0000-000000000003', 'Đối tác chiến lược 3', 'strategic', '/images/partners/doi-tac-03.jpg', null, 3, true),
  ('00000000-0000-0000-0000-000000000004', 'Đối tác chiến lược 4', 'strategic', '/images/partners/doi-tac-04.jpg', null, 4, true),
  ('00000000-0000-0000-0000-000000000005', 'Đối tác chiến lược 5', 'strategic', '/images/partners/doi-tac-05.jpg', null, 5, true),
  ('00000000-0000-0000-0000-000000000006', 'Đối tác chiến lược 6', 'strategic', '/images/partners/doi-tac-06.jpg', null, 6, true),
  ('00000000-0000-0000-0000-000000000007', 'Phòng khám Nhà Mình 1', 'clinic', '/images/partners/doi-tac-07.jpg', null, 1, true),
  ('00000000-0000-0000-0000-000000000008', 'Phòng khám Nhà Mình 2', 'clinic', '/images/partners/doi-tac-08.jpg', null, 2, true),
  ('00000000-0000-0000-0000-000000000009', 'Phòng khám Nhà Mình 3', 'clinic', '/images/partners/doi-tac-09.jpg', null, 3, true),
  ('00000000-0000-0000-0000-00000000000a', 'Mạng lưới CBO Đồng bằng Sông Cửu Long', 'network', '/images/partners/doi-tac-10.jpg', null, 1, true)
on conflict (id) do update set
  name = excluded.name,
  "group" = excluded."group",
  logo_url = excluded.logo_url,
  website_url = excluded.website_url,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ------------------------------------------------------------
-- 4. Nội dung tĩnh (site_settings)
--    Khớp với lib/settings.ts — nếu đổi ở đây, cập nhật luôn file TS.
-- ------------------------------------------------------------

insert into public.site_settings (key, value) values
('hero', '{
  "badge": "Thành lập 04/12/2022",
  "title": "Cùng Sát Cánh nâng cao sức khỏe cộng đồng",
  "subtitle": "Tổ chức Dựa vào Cộng đồng CBO Sát Cánh đồng hành cùng mọi người trong chăm sóc sức khỏe, phòng chống HIV/AIDS và thiện nguyện xã hội — không kỳ thị, không ai bị bỏ lại phía sau.",
  "image": null,
  "cta_label": "Nhận tư vấn miễn phí",
  "cta_href": "/lien-he"
}'::jsonb),

('about', '{
  "paragraphs": [
    "Tổ chức Dựa vào Cộng đồng CBO Sát Cánh được thành lập ngày 04/12/2022, hoạt động trong lĩnh vực y tế cộng đồng và thiện nguyện xã hội. Với tinh thần sẻ chia, trách nhiệm và nhân ái, CBO Sát Cánh luôn nỗ lực kết nối nguồn lực, đồng hành cùng cộng đồng trong công tác chăm sóc sức khỏe, phòng chống HIV/AIDS, hỗ trợ những người có hoàn cảnh khó khăn và lan tỏa những giá trị tích cực đến xã hội.",
    "CBO Sát Cánh tin rằng mỗi hành động yêu thương, dù nhỏ bé, đều có thể tạo nên những thay đổi ý nghĩa cho cộng đồng."
  ],
  "stats": [
    { "value": "04/12/2022", "label": "Ngày thành lập" },
    { "value": "04", "label": "Dịch vụ y tế cộng đồng" },
    { "value": "10+", "label": "Đối tác chiến lược" },
    { "value": "03", "label": "Giá trị cốt lõi đồng hành" }
  ]
}'::jsonb),

('vision', '{
  "heading": "Tầm nhìn",
  "body": "Tổ chức hoạt động hiệu quả, uy tín và bền vững trong lĩnh vực y tế cộng đồng và thiện nguyện xã hội; góp phần xây dựng một cộng đồng khỏe mạnh, bình đẳng, nhân ái, không kỳ thị và không ai bị bỏ lại phía sau."
}'::jsonb),

('mission', '{
  "heading": "Sứ mệnh",
  "body": "Nâng cao sức khỏe cộng đồng, đồng hành cùng người yếu thế và lan tỏa yêu thương thông qua các hoạt động y tế và thiện nguyện xã hội."
}'::jsonb),

('values', '[
  {
    "title": "Lắng nghe, đồng hành",
    "description": "Chúng tôi lắng nghe từng câu chuyện và đi cùng bạn trên suốt hành trình, không phán xét."
  },
  {
    "title": "Quan tâm, thấu hiểu",
    "description": "Thấu cảm hoàn cảnh của mỗi người để đưa ra sự hỗ trợ đúng lúc, đúng cách."
  },
  {
    "title": "Sẻ chia, nhân ái",
    "description": "Lan tỏa những giá trị tích cực đến xã hội bằng những việc làm thiết thực mỗi ngày."
  }
]'::jsonb),

('contact', '{
  "hotline": ["0967.206.095", "0396.433.095"],
  "email": "satcanhkg68@gmail.com",
  "fanpage": "CBO SÁT CÁNH",
  "fanpage_url": "https://www.facebook.com/",
  "zalo": "0967206095",
  "address": "",
  "working_hours": "Thứ 2 – Chủ nhật: 08:00 – 17:00"
}'::jsonb),

('map', '{ "embed": "", "address": "" }'::jsonb),

('footer', '{
  "slogan": "Mỗi hành động yêu thương, dù nhỏ bé, đều có thể tạo nên những thay đổi ý nghĩa cho cộng đồng.",
  "copyright": "© 2026 Tổ chức Dựa vào Cộng đồng CBO Sát Cánh."
}'::jsonb),

('seo', '{
  "title": "CBO Sát Cánh — Y tế cộng đồng & thiện nguyện xã hội",
  "description": "CBO Sát Cánh: xét nghiệm nhanh HIV/STIs, PrEP, PEP, chuyển gửi điều trị ARV. Đồng hành cùng cộng đồng khỏe mạnh, bình đẳng, nhân ái."
}'::jsonb),

('theme', '{
  "primary": "#279CD7",
  "dark": "#1C4592",
  "ink": "#454C56",
  "surface": "#FFFFFF",
  "muted": "#F5F8FA",
  "accent": "#FFB020",
  "line": "#E3EAF0",
  "radius": 16,
  "fontScale": 1
}'::jsonb)

on conflict (key) do nothing;

-- ------------------------------------------------------------
-- 5. Bài viết mẫu (3)
-- ------------------------------------------------------------
insert into public.posts
  (slug, title, excerpt, content_md, category, status, is_featured, published_at, meta_title, meta_description)
values
(
  'xet-nghiem-nhanh-mien-phi-tai-cong-dong',
  'Xét nghiệm nhanh HIV/STIs miễn phí tại cộng đồng',
  'CBO Sát Cánh tổ chức buổi xét nghiệm nhanh, bảo mật và miễn phí tại cộng đồng.',
  E'## Miễn phí — bảo mật — không kỳ thị\n\nCBO Sát Cánh phối hợp cùng các đối tác tổ chức **xét nghiệm nhanh HIV/STIs** ngay tại cộng đồng.\n\n### Bạn được gì\n\n- Cho kết quả trong vài phút\n- Được tư vấn bảo mật 1-1\n- Không mất phí, không cần giấy tờ\n\n> Nếu kết quả dương tính, chúng tôi đồng hành cùng bạn chuyển gửi điều trị ARV.\n\n## Thời gian & địa điểm\n\nLiên hệ hotline **0967.206.095** để biết buổi xét nghiệm gần nhất.',
  'hoat-dong', 'published', true, now(),
  'Xét nghiệm nhanh HIV/STIs miễn phí tại cộng đồng | CBO Sát Cánh',
  'Xét nghiệm nhanh HIV/STIs miễn phí, bảo mật tại cộng đồng do CBO Sát Cánh tổ chức.'
),
(
  'dong-hanh-cung-nguoi-phoi-nhiem-hiv',
  'Đồng hành cùng người phơi nhiễm HIV',
  'Lộ trình tư vấn, xét nghiệm, chuyển gửi điều trị và chăm sóc suốt hành trình.',
  E'## Không ai bị bỏ lại phía sau\n\nChúng tôi đồng hành cùng bạn qua từng bước:\n\n1. Tư vấn và xét nghiệm xác định\n2. Chuyển gửi cơ sở điều trị uy tín\n3. Theo dõi và hỗ trợ tuân thủ điều trị\n\n### PrEP và PEP\n\n- **PrEP**: dùng hằng ngày để phòng trước phơi nhiễm\n- **PEP**: dùng trong vòng 72 giờ sau phơi nhiễm — gọi ngay hotline\n\n## Liên hệ\n\nHotline: **0967.206.095 – 0396.433.095**',
  'tin-tuc', 'published', true, now(),
  'Đồng hành cùng người phơi nhiễm HIV | CBO Sát Cánh',
  'Tư vấn PrEP, PEP và chuyển gửi điều trị ARV — đồng hành cùng người phơi nhiễm HIV.'
),
(
  'thanh-nien-cbo-tuyen-tung-tinh-nguyen',
  'Thanh niên CBO tuyên truyền tình nguyện tại địa phương',
  'Hoạt động tuyên truyền phòng chống HIV/AIDS do đội thanh niên CBO Sát Cánh thực hiện.',
  E'## Hoạt động tại địa phương\n\nĐội thanh niên CBO Sát Cánh phối hợp tổ chức buổi **tuyên truyền phòng chống HIV/AIDS**.\n\n- Truyền tải kiến thức đúng, dễ hiểu\n- Phá bỏ kỳ thị với người nhiễm HIV\n- Kết nối dịch vụ xét nghiệm và tư vấn\n\nMỗi hành động yêu thương đều có thể tạo nên thay đổi ý nghĩa cho cộng đồng.',
  'tin-tuc', 'published', false, now(),
  null, null
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content_md = excluded.content_md,
  category = excluded.category,
  status = excluded.status,
  is_featured = excluded.is_featured,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  updated_at = now();
