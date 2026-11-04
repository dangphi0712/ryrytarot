# Ryry Tarot – Đặt lịch xem Tarot

Stack: **Next.js** (React + TypeScript) · **Bootstrap 5** · **MUI** · **Supabase** (PostgreSQL + Auth) · **Google Meet** · **SMTP** (gửi email)

## Tính năng

- **Khách**: xem bộ bài, bảng giá, rồi đặt lịch qua popup 4 bước (gói dịch vụ → ngày & giờ → thông tin → hoàn tất). Email là bắt buộc.
- **Admin** (`/admin`): đăng nhập bằng Supabase Auth, quản lý lịch trống, bộ bài, lịch hẹn. Khi dán link Google Meet vào một lịch hẹn, hệ thống tự gửi email cho khách.
- Chống đặt trùng ở tầng database (unique index), không chỉ kiểm tra ở frontend.

## Cài đặt

### 1. Supabase

1. Tạo project mới tại supabase.com.
2. Vào **SQL Editor**, dán toàn bộ nội dung [supabase/schema.sql](supabase/schema.sql) rồi chạy. Nếu đã có database cũ, chạy [supabase/migrate-service-options.sql](supabase/migrate-service-options.sql) thay vì schema.
3. Chạy [supabase/decks.sql](supabase/decks.sql) để tạo bảng bộ bài.
4. Vào **Authentication → Users → Add user** để tạo tài khoản admin (email + mật khẩu, chọn Auto Confirm).

### 2. Biến môi trường

```bash
cp .env.example .env.local
```

Điền `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (lấy trong Project Settings → API), `ADMIN_EMAILS`, và các biến `SMTP_*` (xem mục Gửi email).

> `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng trên server. Không được đặt tiền tố `NEXT_PUBLIC_`.

### 3. Chạy project

```bash
npm install
npm run dev
```

- Trang khách: http://localhost:3000
- Trang admin: http://localhost:3000/admin

## Gửi email link Google Meet

Khi admin dán link Meet vào một lịch hẹn và bấm **Lưu**, hệ thống gửi email cho khách. Email chỉ được gửi khi link thay đổi, nên lưu lại cùng một link sẽ không gửi lặp.

Cấu hình với Gmail:
1. Bật **Xác minh 2 bước** cho tài khoản Gmail (myaccount.google.com → Bảo mật).
2. Vào https://myaccount.google.com/apppasswords, tạo **App password** (đặt tên bất kỳ). Google sẽ hiện mật khẩu 16 ký tự.
3. Điền vào `.env.local`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=mat-khau-16-ky-tu
   SMTP_FROM="Ryry Tarot <your-email@gmail.com>"
   ```

Có thể dùng SMTP khác (Zoho, SendGrid, Brevo…) bằng cách đổi `SMTP_HOST`, `SMTP_PORT` và thông tin đăng nhập.

Nếu email không gửi được, trang Lịch hẹn vẫn lưu link và báo lỗi cụ thể.

## Cấu trúc

```
app/
  page.tsx                  Trang chủ (khách)
  admin/page.tsx            Trang quản trị (đăng nhập + 3 tab)
  api/services              GET dịch vụ và gói giá
  api/availability          GET khung giờ trống theo ngày
  api/bookings              POST đặt lịch
  api/decks                 GET bộ bài đang bật
  api/admin/slots           GET/POST/DELETE lịch trống (cần token admin)
  api/admin/bookings        GET/PATCH lịch hẹn, gửi email khi có link (cần token admin)
  api/admin/decks           GET/POST/PATCH/DELETE bộ bài (cần token admin)
components/
  Hero.tsx                  Phần đầu trang
  SiteHeader.tsx            Thanh menu
  DeckExplorer.tsx          Khám phá bộ bài
  Pricing.tsx               Bảng giá
  BookingForm.tsx           Popup đặt lịch 4 bước
  BookingContext.tsx        Mở popup từ bất kỳ nút nào
  admin/SlotManager.tsx     Thiết lập lịch trống
  admin/BookingManager.tsx  Quản lý lịch hẹn và link Meet
  admin/DeckManager.tsx     Quản lý bộ bài
lib/
  supabase-admin.ts         Client service role (server)
  supabase-browser.ts       Client anon (đăng nhập admin)
  admin-auth.ts             Kiểm tra email admin từ access token
  mail.ts                   Gửi email link Meet qua SMTP
  time.ts                   Xử lý múi giờ Việt Nam (UTC+7)
  constants.ts              Trạng thái lịch hẹn
supabase/
  schema.sql                Schema + dữ liệu mẫu (project mới)
  migrate-service-options.sql  Chuyển sang 1 dịch vụ + nhiều gói (project cũ)
  decks.sql                 Bảng bộ bài
```

## Ghi chú

- Múi giờ cố định UTC+7 (Việt Nam).
- Khách đặt lịch ở trạng thái **Chờ xác nhận**. Admin dán link Meet và đổi trạng thái sang **Đã xác nhận**.
- Chưa có thông báo đặt lịch mới cho admin và nhắc lịch trước giờ hẹn.
