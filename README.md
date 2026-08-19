# Happy Snack House — Partner Directory

Directory publik ringan untuk pengunjung dari Instagram/Facebook: "di toko
mana saja produk HSH tersedia?" Tanpa login, tanpa checkout — hanya daftar
mitra + tombol Lokasi (Google Maps) dan Toples (stok produk).

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Untuk build produksi:

```bash
npm run build
npm run preview
```

Hasil build ada di folder `dist/` — upload folder ini ke hosting statis
apa saja (Vercel, Netlify, Cloudflare Pages, dsb), lalu pasang URL-nya di
bio Instagram/Facebook.

## Mengakses Admin Mode

Admin Mode **hanya bisa dibuka dari desktop/PC** (tidak ada tombol admin
sama sekali di tampilan publik, dan shortcut ini sengaja dimatikan di
mobile):

1. Buka website di browser desktop.
2. Tekan **Ctrl + X** (di luar kotak input teks).
3. Masukkan PIN admin.
4. Kelola mitra: tambah, edit, atur stok toples, nonaktifkan, atau hapus.

PIN admin untuk versi development ada di
`src/services/authService.ts` (`DEV_ADMIN_PIN`). **Ganti nilai ini sebelum
dipakai secara nyata**, dan jangan commit PIN produksi ke repo publik.

## Catatan keamanan

PIN ini adalah pengaman sisi client (client-side), tujuannya supaya
customer biasa tidak sengaja masuk ke mode admin — **bukan** keamanan
tingkat produksi. Siapa pun yang membuka developer tools bisa melihat
PIN di source code. Jika nanti dipakai oleh banyak admin atau menyimpan
data yang lebih sensitif, ganti `authService` dengan autentikasi
backend sungguhan.

## Menambah produk baru

Tambahkan entri baru di `src/data/products.ts` (id, name, image, active).
Produk baru otomatis muncul di form admin dan di seluruh app — tidak perlu
mengubah komponen lain.

## Struktur data

Data mitra & admin session disimpan di `localStorage`/`sessionStorage`
browser lewat `src/services/storageService.ts`. Semua akses storage lewat
`partnerService`, `productService`, dan `authService` — jadi kalau nanti
mau pindah ke backend (Firebase/Supabase/API), cukup ganti isi 3 service
itu tanpa menyentuh komponen UI.

## Struktur folder

```
src/
├── components/   # PartnerCard, PartnerModal, ProductStockList, AdminModal, PartnerForm, ConfirmDialog
├── data/         # master product catalog + seed data
├── services/     # storageService, partnerService, productService, authService
├── types/        # Partner, Product
├── pages/        # PublicDirectory, AdminPanel
└── App.tsx        # routing antara mode publik & admin + hidden Ctrl+X trigger
```
