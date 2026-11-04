-- Chạy file này trong Supabase: SQL Editor → New query → Run
-- Chỉ dùng cho project MỚI. Nếu đã chạy schema cũ, chạy supabase/migrate-service-options.sql thay thế.

create extension if not exists pgcrypto;

-- Dịch vụ (hiện là một dịch vụ duy nhất)
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Gói giá của dịch vụ
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

-- Lịch trống do admin thiết lập (mỗi dòng = 1 khung giờ)
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null unique,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

-- Lịch hẹn của khách
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references availability(id) on delete restrict,
  service_id uuid not null references services(id),
  option_id uuid references service_options(id),
  customer_name text not null,
  phone text not null,
  email text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'done')),
  meet_link text,
  created_at timestamptz not null default now()
);

-- Chống đặt trùng: mỗi khung giờ chỉ có 1 lịch đang hoạt động
create unique index if not exists bookings_one_active_per_slot
  on bookings (slot_id)
  where status <> 'cancelled';

-- Row Level Security: khách chỉ được đọc dịch vụ, gói giá và lịch trống.
-- Mọi thao tác ghi đi qua API server bằng service role key.
alter table services enable row level security;
alter table service_options enable row level security;
alter table availability enable row level security;
alter table bookings enable row level security;

drop policy if exists "Public đọc dịch vụ đang bật" on services;
create policy "Public đọc dịch vụ đang bật"
  on services for select
  using (is_active = true);

drop policy if exists "Public đọc gói đang bật" on service_options;
create policy "Public đọc gói đang bật"
  on service_options for select
  using (is_active = true);

drop policy if exists "Public đọc lịch trống" on availability;
create policy "Public đọc lịch trống"
  on availability for select
  using (true);

-- Dữ liệu mẫu: 1 dịch vụ với 2 gói giá
with s as (
  insert into services (name, description)
  values ('Xem Tarot', 'Chọn hình thức xem phù hợp với bạn.')
  returning id
)
insert into service_options (service_id, name, description, price_vnd, sort_order)
select s.id, v.name, v.description, v.price, v.sort_order
from s
cross join (values
  ('Hỏi nhanh', '1 câu hỏi cụ thể, rút một lá bài để trả lời', 40000, 1),
  ('Xem trọn 1 giờ', 'Trải bài, phân tích chi tiết và hỏi đáp nhiều câu', 100000, 2)
) as v(name, description, price, sort_order);
