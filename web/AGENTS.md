# AGENTS.md — Konteks Proyek cekkontak.online

> Dokumen ini untuk membantu AI agent melanjutkan pekerjaan tanpa harus menebak-nebak.
> Update dokumen ini setiap kali ada perubahan penting.

---

## 🌐 Overview Produk

**cekkontak.online** — Layanan cek nama di balik nomor HP menggunakan data GetContact.
- Bayar **Rp 500** per pencarian via **ShopeePay QRIS**
- Hasil instan, tanpa daftar, tanpa login
- Target: customer yang ingin cek nomor tak dikenal

**Stack:** Next.js 16 (App Router) · TypeScript · Vanilla CSS · Vercel

---

## 🗂️ Struktur Penting

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Halaman utama + modal payment
│   │   ├── layout.tsx            ← Root layout
│   │   ├── globals.css           ← Style global
│   │   └── api/
│   │       ├── payment/
│   │       │   ├── create/       ← POST: buat QRIS ke SphixRay
│   │       │   ├── status/       ← GET: cek status bayar (poll)
│   │       │   └── webhook/      ← POST: terima notif dari SphixRay
│   │       ├── search/           ← GET: cari nomor via GetContact
│   │       ├── promo/
│   │       │   ├── use/          ← POST: pakai kode promo gratis
│   │       │   └── validate/     ← POST: validasi kode promo
│   │       └── admin/
│   │           ├── auth/         ← POST: login admin
│   │           └── promos/       ← CRUD kode promo
│   └── lib/
│       ├── orderStore.ts         ← In-memory order store + pgTxMap
│       ├── rateLimit.ts          ← Rate limiter per IP
│       └── searchTokenStore.ts   ← Token sekali pakai untuk hasil search
```

---

## 💳 Payment Gateway: SphixRay

**Provider:** https://pg.sphixray.com/docs  
**Base URL:** `https://api.pg.sphixray.com`  
**API Key env var:** `AGP_API_KEY` (format: `agp_a693ab...`)  
**Metode:** ShopeePay QRIS  

### Endpoints yang dipakai:
| Endpoint | Method | Fungsi |
|---|---|---|
| `/shopeepay/qris/create` | POST | Buat QRIS, returns `order_sn`, `qr_string`, `qr_url` |
| `/shopeepay/transactions?limit=20` | GET | Cek status, match by `order_sn` |

### Webhook:
- URL: `https://www.cekkontak.online/api/payment/webhook`
- Header: `X-Signature` = HMAC-SHA256
- Response WAJIB: `{ "success": true }` HTTP 200
- Verifikasi: 8 kombinasi (key full/no-prefix x body raw/reserialized x hex/base64)

---

## 🔄 Alur Pembayaran

```
1. POST /api/payment/create
   → SphixRay /shopeepay/qris/create { amount: 500 }
   → Simpan order + pgTxMap[order_sn → orderId]
   → Return: { orderId, pgTxId: order_sn, qrString, qrUrl, expiredAt }

2. Frontend poll setiap 4 detik:
   GET /api/payment/status?orderId=xxx&pgTxId=yyy
   (pgTxId selalu dikirim untuk cold-start resilience)

3. Status route:
   → Cek memori (order.pg_txid) atau pgTxId dari URL (cold start)
   → Query SphixRay transactions, match order_sn
   → Jika paid: completeOrder() → searchToken

4. Webhook (notif real-time dari SphixRay):
   → Verif HMAC → getOrderByPgTxId(transaction.id) → completeOrder()

5. Frontend: searchToken → GET /api/search?token=xxx → hasil GetContact
```

---

## 🗄️ OrderStore

File: `src/lib/orderStore.ts` — **In-memory, reset saat cold start.**

**orderId format:** `CK-{timestamp}-{phone_base64url}-{rand3hex}`  
(phone ter-encode → bisa di-recover tanpa database)

**JANGAN pakai `getOrderByAmount()`** di webhook — semua order = Rp500, nabrak kalau concurrent.

**Cold-start resilience:** Frontend kirim `pgTxId` di URL status, server pakai itu untuk query langsung ke SphixRay.

---

## 🚀 Deploy

```bash
cd web
npx vercel --prod --yes
```

> ⚠️ SELALU dari folder `web/`  
> ⚠️ Vercel CLI upload file LOKAL — pastikan file sudah correct sebelum deploy  
> ⚠️ Commit ke git juga agar tetap sinkron  

**Vercel env vars:**
- `AGP_API_KEY` — API key SphixRay
- `ADMIN_PASSWORD` — password halaman /admin

---

## 🐛 Bug History & Fix

| Bug | Penyebab | Fix |
|---|---|---|
| "invalid API key" | File create/route.ts versi PayGomerch ter-deploy | Revert ke SphixRay endpoint |
| "signature verification failed" | Response `{message:"OK"}` bukan `{success:true}` | Fix response format |
| Concurrent order nabrak | Fallback `getOrderByAmount(500)` ambiguous | Hapus fallback, match by order_sn saja |
| Cold start status stuck "pending" | pgTxId tidak tersedia di instance baru | Frontend kirim pgTxId di URL |
| "callback returned status 401" | Webhook return 401 untuk signature invalid | Coba 8 kombinasi HMAC |

---

## ✅ Status (2026-09-25)

- [x] ShopeePay QRIS Rp 500 berfungsi
- [x] Webhook terdaftar & verified di SphixRay
- [x] Concurrent order safe
- [x] Cold-start resilience
- [x] Rate limiting, promo, admin panel
- [ ] Database persisten (saat ini in-memory) → next step: Vercel KV
