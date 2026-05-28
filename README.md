# AI Blog Generator - ReactJS + Tailwind CSS

Ứng dụng tạo nội dung blog bằng AI, cho phép nhập chủ đề, sinh nội dung tự động, chỉnh sửa trực tiếp với Markdown editor và xem trước bài viết.

Website mẫu: [Demo](https://reactjs-blog-ai-generate.vercel.app/)

## Tính năng chính

### Generate Blog Content

- Nhập chủ đề blog vào ô input.
- Nhấn `Tạo nội dung` để gọi API nội bộ.
- Không gọi API nếu input trống hoặc chỉ chứa khoảng trắng.

### API Integration

- Route nội bộ: `/api/generate-content`.
- Gọi Gemini API (`gemini-2.5-flash`) nếu `GEMINI_API_KEY` được cấu hình.
- Xử lý trạng thái: Loading / Success / Error.
- Fallback mock content nếu API lỗi hoặc không có key, vẫn trả về content để user tiếp tục chỉnh sửa và preview.

### Markdown Editor

- Hỗ trợ Bold, Italic, Heading 1/2.
- Hỗ trợ Ordered list và Unordered list.
- Hiển thị số ký tự realtime.
- Nút `Xóa tất cả` để reset nội dung.

### Preview Page

- Chuyển sang trang preview khi nội dung hợp lệ.
- Dữ liệu truyền bằng `localStorage`.
- Render bằng `react-markdown` và `remark-gfm`.

### Responsive UI

- Thiết kế mobile-first, responsive cho desktop và tablet.
- Khoảng cách rõ ràng, layout dễ đọc.
- Hover/focus state cho các button chính.

## Tech Stack

- React
- JavaScript
- Tailwind CSS
- Vite

## Thư viện

- `react-markdown`
- `remark-gfm`
- `react-router-dom`
- `sonner`
- `@tailwindcss/typography`

## Cài đặt và chạy dự án

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo file `.env` từ `.env.example`

Trên Windows:

```bash
copy .env.example .env
```

Trên macOS/Linux:

```bash
cp .env.example .env
```

### 3. Thêm Gemini API key

Thêm `GEMINI_API_KEY` vào file `.env` nếu có:

```env
GEMINI_API_KEY=your_api_key_here
```

Nếu không có API key hoặc API không truy cập được, ứng dụng sẽ tự động dùng mock content.

### 4. Chạy app

```bash
npm run dev
```

### 5. Build và xem preview production

```bash
npm run build
npm run preview
```

## Ghi chú

- Không commit API key trực tiếp lên GitHub.
- Nếu thiếu key hoặc API không truy cập được, app tự động chuyển sang mock content.
- Nội dung preview được lưu qua `localStorage` để giữ topic và content.
