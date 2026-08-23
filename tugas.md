# TUGAS SECURE SEARCH APP

**Nama:** Fransdito Bayu Pratama
**NIM:** 20240140044

---

# BAGIAN 1 — EKSPLORASI

## 1. SQL Injection

### Payload yang digunakan

```text
' OR '1'='1
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b8b75ddd-0866-49c1-8fb6-6b22fae734a1" />

### Penjelasan

Payload tersebut dapat menembus proses pencarian karena input dari pengguna langsung digunakan dalam query SQL tanpa menggunakan parameterized query. Karakter `'` dapat mengubah struktur query sehingga kondisi `'1'='1'` selalu bernilai benar.

Bagian kode yang menjadi celah adalah query database yang menggabungkan input pengguna secara langsung ke dalam string SQL.

Contoh pola kode yang rentan:

```js
const query = `SELECT * FROM products WHERE name LIKE '%${search}%'`;
```

Input pengguna seharusnya tidak dimasukkan langsung ke dalam query seperti tersebut.

---

## 2. XSS Reflected

### Payload yang digunakan

```html
<script>alert('XSS Reflected')</script>
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/975dba36-1077-4878-b7bd-d95364f2bd6e" />


### Penjelasan

Payload berhasil dijalankan karena input pengguna dikembalikan langsung ke halaman HTML tanpa dilakukan escaping. Browser kemudian menganggap input tersebut sebagai kode HTML/JavaScript dan menjalankannya.

Kerentanan terjadi ketika data dari request pengguna langsung dimasukkan ke response HTML tanpa proses escaping.

Contoh pola kode yang rentan:

```js
res.send(`<h2>Hasil pencarian: ${search}</h2>`);
```

Input pengguna seharusnya di-escape sebelum ditampilkan kembali kepada browser.

---

## 3. XSS Stored

### Payload yang digunakan

```html
<script>alert('XSS Stored')</script>
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a0f9c0ca-2cc9-44e1-b159-7e43ff3ba80e" />


### Penjelasan

Pada XSS Stored, payload terlebih dahulu disimpan ke database. Ketika data tersebut ditampilkan kembali kepada pengguna, payload ikut dirender sebagai HTML/JavaScript sehingga dapat dieksekusi oleh browser.

Celah terjadi karena data yang berasal dari database ditampilkan menggunakan mekanisme yang tidak melakukan escaping.

Contoh pola kode yang rentan pada EJS:

```ejs
<%- comment.text %>
```

Tag `<%- %>` membuat isi ditampilkan sebagai HTML mentah sehingga payload JavaScript dapat dijalankan.

---

## 4. Escape HTML

### Payload yang digunakan

```html
<img src=x onerror=alert('XSS')>
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/29739bb3-d27e-45bc-afd5-59e1f4a442e7" />

### Penjelasan

Payload dapat dieksekusi apabila data pengguna ditampilkan sebagai HTML mentah tanpa escaping. Tag HTML dan atribut event seperti `onerror` kemudian diproses oleh browser.

Penggunaan output HTML tanpa escaping merupakan sumber masalah pada bagian ini.

Contoh output yang rentan:

```ejs
<%- data %>
```

Seharusnya digunakan mekanisme escaping seperti:

```ejs
<%= data %>
```

---

# BAGIAN 2 — IMPLEMENTASI MANDIRI

## Tema: Form Komentar Produk Aman

Pada bagian ini dibuat halaman baru berupa form komentar produk. Pengguna dapat memasukkan nama dan komentar, kemudian data akan divalidasi, disanitasi, disimpan, dan ditampilkan kembali dengan aman.

Tujuan implementasi adalah memastikan halaman tidak rentan terhadap SQL Injection maupun Cross-Site Scripting (XSS).

---

# 1. Server-Side Validation

Validasi dilakukan di server menggunakan Express. Validasi tidak hanya bergantung pada atribut HTML atau JavaScript di browser.

Contoh validasi:

```js
if (!name || name.trim() === '') {
    return res.status(400).send('Nama wajib diisi.');
}

if (!comment || comment.trim().length < 5) {
    return res.status(400).send('Komentar minimal 5 karakter.');
}

if (name.trim().length > 50) {
    return res.status(400).send('Nama maksimal 50 karakter.');
}
```

Dengan demikian, meskipun pengguna mencoba mengirim request secara langsung tanpa melalui validasi browser, server tetap melakukan pemeriksaan terhadap data tersebut.

### Pengujian

Input:

```text
Nama:
Komentar: hai
```

Hasil:

```text
Komentar minimal 5 karakter.
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4d5657da-2e52-4d4c-807a-b7a1b18f3093" />

### Kesimpulan

Data invalid berhasil ditolak oleh server sehingga validasi tidak hanya bergantung pada sisi client.

---

# 2. Sanitasi Input

Input pengguna dilakukan sanitasi sebelum diproses atau disimpan.

Contoh:

```js
const cleanName = name.trim();
const cleanComment = comment.trim();
```

### Before

```text
"   Fransdito Bayu Pratama   "
```

### After

```text
"Fransdito Bayu Pratama"
```

Proses `trim()` menghilangkan whitespace yang tidak diperlukan pada awal dan akhir input.

Selain sanitasi sebelum penyimpanan, output juga tetap harus di-escape ketika ditampilkan kepada pengguna.

### Contoh input berbahaya

```html
<script>alert('XSS')</script>
```

Input tersebut tidak boleh dipercaya sebagai HTML dan tidak boleh ditampilkan sebagai HTML mentah.

---

{
  "teks": "&lt;b&gt;Fransdito&lt;&#x2F;b&gt;",
  "email_input": ""
}

# 3. Escape Data Saat Render

Data komentar yang berasal dari pengguna ditampilkan menggunakan escaping.

Pada EJS digunakan:

```ejs
<%= comment.name %>
```

dan:

```ejs
<%= comment.text %>
```

Bukan:

```ejs
<%- comment.name %>
```

atau:

```ejs
<%- comment.text %>
```

Perbedaannya adalah `<%= %>` melakukan HTML escaping sehingga karakter seperti `<` dan `>` tidak diproses sebagai tag HTML.

---

## Pengujian XSS

Input:

```html
<script>alert(1)</script>
```

### Hasil yang diharapkan

Browser **tidak menjalankan JavaScript**.

Payload ditampilkan sebagai teks, misalnya:

```text
<script>alert(1)</script>
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/34209136-5947-4ba4-9038-c2557effd74f" />


### Penjelasan

XSS tidak berhasil karena data pengguna di-escape ketika dirender menggunakan `<%= %>`. Browser tidak menganggap input tersebut sebagai elemen `<script>`, sehingga JavaScript tidak dieksekusi.

---

# 4. Parameterized Query

Query database yang menggunakan input pengguna menggunakan parameterized query.

Contoh:

```js
const result = await db.query(
    'SELECT * FROM comments WHERE name = $1',
    [cleanName]
);
```

Input pengguna tidak digabungkan langsung ke string SQL.

### Contoh yang tidak aman

```js
const result = await db.query(
    `SELECT * FROM comments WHERE name = '${cleanName}'`
);
```

Kode tersebut berbahaya karena input pengguna dapat memengaruhi struktur query SQL.

### Contoh yang aman

```js
const result = await db.query(
    'SELECT * FROM comments WHERE name = $1',
    [cleanName]
);
```

Parameter `$1` akan diperlakukan sebagai nilai data dan bukan sebagai bagian dari perintah SQL.

---

# 5. Pengujian SQL Injection

Setelah halaman selesai dibuat, dilakukan pengujian menggunakan payload SQL Injection.

### Payload

```text
' OR '1'='1
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4eab06a8-fac4-45f8-9171-ed2e3b057daf" />


### Hasil

Payload tidak berhasil memanipulasi query database.

### Penjelasan

Serangan gagal karena query menggunakan parameterized query. Input pengguna dikirim sebagai parameter sehingga karakter SQL yang terdapat di dalam input tidak dianggap sebagai bagian dari perintah SQL.

---

# 6. Pengujian XSS Reflected

### Payload

```html
<script>alert('XSS')</script>
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f771be82-fefa-4394-bd02-6140b614d0e4" />


### Hasil

JavaScript tidak dijalankan oleh browser.

### Penjelasan

Data pengguna di-escape ketika ditampilkan kembali ke halaman sehingga tag `<script>` diperlakukan sebagai teks biasa.

---

# 7. Pengujian XSS Stored

### Payload

```html
<script>alert('XSS Stored')</script>
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e8478973-e09d-43ec-8974-4eddbbda8c01" />

### Hasil

Payload tersimpan sebagai data biasa dan tidak dieksekusi ketika halaman dibuka kembali.

### Penjelasan

Walaupun data pengguna tersimpan di database, data tersebut tetap di-escape ketika dirender menggunakan `<%= %>`. Dengan demikian, database tidak menjadi alasan untuk mempercayai data tersebut sebagai HTML yang aman.

---

# 8. Pengujian HTML Injection

### Payload

```html
<img src=x onerror=alert('XSS')>
```

### Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1925e0e9-bdde-4cbd-b723-c9fefb34c00a" />

### Hasil

Event JavaScript tidak dijalankan.

### Penjelasan

Karakter HTML pada input pengguna di-escape ketika ditampilkan sehingga browser tidak membuat elemen `<img>` dari input tersebut.

---

# 9. Ringkasan Keamanan

| Pengujian              | Hasil          |
| ---------------------- | -------------- |
| Server-side validation | Berhasil       |
| Sanitasi input         | Berhasil       |
| Escape output          | Berhasil       |
| SQL Injection          | Gagal menembus |
| XSS Reflected          | Gagal menembus |
| XSS Stored             | Gagal menembus |
| HTML Injection         | Gagal menembus |
| Parameterized query    | Diterapkan     |

---

# 10. Kesimpulan

Berdasarkan implementasi dan pengujian yang dilakukan, halaman komentar produk telah menerapkan beberapa mekanisme keamanan dasar pada aplikasi web.

Validasi dilakukan pada server sehingga data invalid tetap dapat ditolak meskipun validasi client dilewati. Input pengguna juga dilakukan sanitasi sebelum diproses.

Pada saat data ditampilkan kembali, digunakan HTML escaping melalui `<%= %>` pada EJS sehingga payload XSS tidak dieksekusi oleh browser.

Selain itu, query database menggunakan parameterized query sehingga input pengguna tidak dapat mengubah struktur SQL. Setelah dilakukan pengujian menggunakan payload SQL Injection, XSS Reflected, XSS Stored, dan HTML Injection, seluruh serangan tersebut gagal menembus halaman yang telah dibuat.

Dengan penerapan validasi server-side, sanitasi, output escaping, dan parameterized query, aplikasi menjadi lebih aman terhadap beberapa jenis serangan umum pada aplikasi web.
