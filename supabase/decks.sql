-- Chạy file này trong Supabase: SQL Editor → New query → Run (chỉ cần chạy một lần)

-- Bộ bài tarot và phần mô tả/ý nghĩa
create table if not exists tarot_decks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tarot_decks enable row level security;

create policy "Public đọc bộ bài đang bật"
  on tarot_decks for select
  using (is_active = true);

-- Dữ liệu mẫu
insert into tarot_decks (name, summary, description, sort_order) values (
  'Rider-Waite-Smith',
  'Bộ bài tarot phổ biến nhất, gồm 78 lá chia làm Ẩn Chính và Ẩn Phụ.',
  'Bộ Rider-Waite-Smith ra đời năm 1909 và là nền tảng của phần lớn các bộ bài tarot hiện nay.

Ẩn Chính (22 lá, từ The Fool đến The World) thể hiện những chặng lớn trong hành trình cuộc đời: sự khởi đầu, thử thách, chuyển biến và trưởng thành.

Ẩn Phụ (56 lá) chia làm 4 chất, mỗi chất tương ứng một lĩnh vực:
• Gậy (Wands): hành động, đam mê, sự nghiệp.
• Cốc (Cups): cảm xúc, các mối quan hệ, tình cảm.
• Kiếm (Swords): suy nghĩ, quyết định, xung đột nội tâm.
• Tiền (Pentacles): vật chất, tài chính, sức khỏe, công việc thực tế.',
  1
);
