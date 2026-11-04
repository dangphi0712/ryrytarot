-- Chuyển sang mô hình: 1 dịch vụ + nhiều gói giá.
-- Chỉ chạy file này nếu bạn ĐÃ chạy schema.sql cũ. Chạy một lần trong SQL Editor.

-- 1. Bảng gói giá của dịch vụ
create table if not exists service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  name text not null,
  description text,
  price_vnd integer not null check (price_vnd >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table service_options enable row level security;

drop policy if exists "Public đọc gói đang bật" on service_options;
create policy "Public đọc gói đang bật"
  on service_options for select
  using (is_active = true);

-- 2. Giữ dịch vụ đầu tiên làm dịch vụ chính, tắt các dịch vụ còn lại (không xóa để giữ lịch cũ)
update services
  set name = 'Xem Tarot', description = 'Chọn hình thức xem phù hợp với bạn.'
  where id = (select id from services order by created_at limit 1);

update services
  set is_active = false
  where id <> (select id from services order by created_at limit 1);

-- 3. Tạo 2 gói giá cho dịch vụ chính (chỉ chạy khi chưa có gói nào)
insert into service_options (service_id, name, description, price_vnd, sort_order)
select s.id, v.name, v.description, v.price, v.sort_order
from services s
cross join (values
  ('Hỏi nhanh', '1 câu hỏi cụ thể, rút một lá bài để trả lời', 40000, 1),
  ('Xem trọn 1 giờ', 'Trải bài, phân tích chi tiết và hỏi đáp nhiều câu', 100000, 2)
) as v(name, description, price, sort_order)
where s.name = 'Xem Tarot'
  and not exists (select 1 from service_options);

-- 4. Bookings lưu thêm gói đã chọn (lịch cũ sẽ để trống)
alter table bookings add column if not exists option_id uuid references service_options(id);

-- 5. Giá đã chuyển sang service_options nên bỏ cột cũ
alter table services drop column if exists price_vnd;
