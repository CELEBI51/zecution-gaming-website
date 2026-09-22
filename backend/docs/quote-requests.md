# Mod talepleri

- Kullanıcı formu: `/teklif-al` (araç için `?type=VEHICLE`, model için `?type=MODEL`).
- Yönetim: `/admin/talepler` ve `/admin/talepler/:id`.
- Kayıtlar PostgreSQL `quote_requests` tablosunda tutulur. E-posta servisi kullanılmaz.
- Referans bağlantısına ek olarak en fazla 5 fotoğraf alınır (her biri en fazla 5 MB, JPG/PNG/WebP, en fazla 40 megapiksel). Fotoğraflar optimize edilmiş WebP olarak veritabanında tutulur; yalnızca yetkili admin fotoğraf uç noktasından okunabilir.
- Durumlar: NEW, REVIEWING, QUOTED, ACCEPTED, REJECTED, COMPLETED.
- Yönetici notları ve iletişim bilgileri yalnızca kimliği doğrulanmış admin API'sinden okunabilir.

## Kurulum

Yeni bir ortama dağıtımda backend dizininde `npm run db:deploy` (mevcut pg dağıtım akışı için `npm run db:deploy:pg`) ve `npm run db:generate` çalıştırılmalıdır. Migration yalnızca yeni enum türlerini ve tabloyu ekler. API ardından yeniden başlatılır.

## API

`POST /api/quotes`: submissionId (UUID), name, email, game, type, description ve isteğe bağlı referenceUrl, budget, desiredDate. website alanı bot filtresidir ve boş olmalıdır. En fazla 5 istek/IP/saat kabul edilir. Başarılı yanıtta yalnızca kayıt kimliği ve tarihi döner; aynı submissionId ile tekrar gönderim çift kayıt oluşturmaz.

Admin oturumu gerektiren uçlar:

- `GET /api/admin/quotes?status=NEW&search=...&page=1&limit=20`
- `GET /api/admin/quotes/:id`
- `PATCH /api/admin/quotes/:id`: status ve adminNotes.
- `GET /api/admin/quotes/:id/photos/:photoId`: yetkili kullanıcıya özel WebP verisi.

Fotoğraflı gönderimler `multipart/form-data` biçimindedir; metin alanlarıyla birlikte `photos` alanı tekrarlanır. Fotoğraflar ve talep tek veritabanı işleminde oluşturulur. Fotoğrafsız JSON gönderimleri de desteklenir.

Cookie oturumlarında yazma işlemleri mevcut CSRF korumasını kullanır. Durum değişiklikleri müşteriye otomatik mesaj göndermez.

## Doğrulama

`npm test`: doğrulama, tekrar gönderim, filtreleme, yetkilendirme, CSRF ve gönderim sınırı testleri.

`npm run test:quotes`: yerel API (`127.0.0.1:4000`) ve yapılandırılmış veritabanı üzerinde gerçek entegrasyon kontrolü. Migration uygulanmış ve API çalışıyor olmalıdır. Benzersiz bir sentetik kayıt oluşturur, tekrar gönderimi ve durum/not kaydını kontrol eder; yalnızca bu teste ait kaydı sonunda siler. E-posta göndermez. Tekrar tekrar çalıştırmak gönderim sınırına takılabilir.
