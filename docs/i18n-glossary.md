# Vietnamese / English glossary

Use these terms in every `*.messages.ts` file and any inline copy. Sentence case for labels in both languages.

| English | Vietnamese | Notes |
| --- | --- | --- |
| Mission | nhiệm vụ | Never "mission" in Vietnamese copy |
| Operator | người vận hành | "Pilot" is a role name: phi công / pilot |
| Manager | quản lý | |
| Customer | khách hàng | |
| Order | đơn hàng | |
| Quote | báo giá | |
| Deposit | tiền đặt cọc | |
| Invoice | hóa đơn | |
| Dashboard / Overview | tổng quan | |
| Support ticket | yêu cầu hỗ trợ | Not "ticket" |
| Upload (verb) | tải lên | Noun: bản tải lên |
| Download | tải xuống | |
| Preflight / Postflight | kiểm tra trước / sau chuyến bay | |
| Evidence | bằng chứng | |
| Checklist | checklist | Accepted loanword, kept |
| Drone | drone | Accepted loanword, kept |
| Media (photo and video files) | media | Accepted loanword, kept in UI copy |
| Telemetry | telemetry | Technical term, kept |
| Flight Controller, GPS, RTK, LiDAR | unchanged | Proper technical names |
| Server / backend | hệ thống / máy chủ | Not "backend" in user copy |
| Sign in / Log in | Đăng nhập | |
| Refresh / Retry | Làm mới / Thử lại | |

## Rules

- Vietnamese: correct diacritics, sentence case ("Chi tiết đơn hàng", not "Chi Tiết Đơn Hàng"), no mixed English where a common term exists.
- English: sentence case for labels; Title Case only for existing page titles; consistent terms (Mission, Operator, Order, Quote, Deposit).
- Strings live in `*.messages.ts` via `defineMessages`. Helpers that return labels take an optional `lang` argument that defaults to the old behaviour.
- Data written to the API (for example the generated mission result summary) is stored text, not UI copy, and is left unchanged.
