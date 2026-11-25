# CLAUDE.md

Bu dosya Claude Code'un bu repoda çalışırken bilmesi gerekenleri anlatır. **Yeni bir bilgisayarda
(ör. Simge'nin) açılan oturumda Claude'un tek bağlam kaynağı budur.** Claude'un kişisel hafızası
bilgisayarlar arasında taşınmaz, o yüzden kalıcı olması gereken her proje bilgisi buraya yazılmalı.
Arayüz metinleri ve proje yazışmaları Türkçe.

## Proje durumu (son güncelleme: 2026-11-25)

- Bu repo (`gunelenes/crmPrebably2`), eski `gunelenes/crm-prebably` reposunun **tam kopyasıdır**
  (tüm commit geçmişi korunarak 2026-11-25'te taşındı). Geliştirme artık **sadece burada** yapılır.
  Eski repo arşiv niteliğinde; ona commit atılmaz.
- Proje sahibi **Enes Günel**. **Simge** ile birlikte geliştiriliyor; çalışmanın bir kısmı Simge'nin
  bilgisayarından yapılacak.
- Repo şu an **public**. Gizli bilgi (token, şifre, müşteri verisi, ticari yazışma) asla commit'lenmez.
  `docs/pitch/` bu yüzden `.gitignore`'da; o klasör sadece Enes'in bilgisayarında var.
- **Railway geçişi devam ediyor:** Canlı sistem hâlâ eski Railway projesinde
  (`crm-prebably-production.up.railway.app`) çalışıyor. Enes bu repoya bağlı **yeni bir Railway
  projesi** kuracak. Adımlar aşağıda, "Yeni Railway projesine geçiş" bölümünde. Bir adım
  tamamlandığında bu bölümü güncelle.

### Ticari bağlam
Ürün tek bir müşteriye (bir eğitim akademisi) özel yazıldı. Hedef, ajanslar üzerinden
bayilik / gelir paylaşımı modeliyle başka işletmelere satmak. Bu yüzden çok kiracılılık
(multi-tenant), veri izolasyonu ve lisans konuları ürün kararlarının parçası.
- `LICENSE` hâlâ **MIT**: başkası kodu alıp ücretsiz satabilir, bu da ticari hedefle çelişiyor.
  README'de işe alım odaklı ifadeler var. İkisi de henüz değiştirilmedi. Lisans, repoyu paylaşma
  veya repo görünürlüğü konusu açılırsa bunu hatırlat; değiştirmeden önce Enes'e sor.
- `OWNER_USERNAME` ile açılan Geliştirici/Sistem Sağlığı paneli bilerek alıcıdan gizlenir.

## Çalışma düzeni
- `main` = canlıya giden kod. Railway `main`'den otomatik deploy eder, yani `main`'e giren her şey
  canlıya çıkar. Riskli işleri ayrı bir branch'te yapıp sonra `main`'e merge etmek tercih edilir.
- Commit/push yapmadan önce kullanıcıya sor (iki kişi aynı repoda çalışıyor).
- Çalışmaya başlamadan önce `git pull` ile diğer kişinin değişikliklerini al.

## Yeni bilgisayarda kurulum
Gerekenler: Git, Python 3.11+, Node 20+.
```bash
git clone https://github.com/gunelenes/crmPrebably2.git
cd crmPrebably2

# Backend
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # macOS/Linux: cp — sonra değerleri doldur
uvicorn app.main:socket_app --reload --port 8000

# Frontend (ayrı terminal)
cd frontend
npm install
copy .env.example .env           # VITE_API_URL=http://localhost:8000/api
npm run dev
```
- `.env` dosyaları git'te yok. Değerleri Enes güvenli bir kanaldan iletir (Railway Variables'tan da
  kopyalanabilir). Minimum: `DATABASE_URL`, `JWT_SECRET`, `INSTAGRAM_TOKEN`, `WEBHOOK_VERIFY_TOKEN`.
- Lokalde **canlı veritabanına bağlanma.** Ayrı bir test Postgres'i kullan (Railway'de ayrı bir
  DB servisi ya da lokal Postgres). Webhook'lar lokale gelmez; Instagram akışını test etmek için
  `POST /api/sync-conversations` veya canlı ortam kullanılır.
- Boş bir DB'de ilk kullanıcı yoktur. `python backend/create_admin.py` INSERT SQL'ini üretir,
  o SQL DB konsolunda çalıştırılır.
- `backend/venv/` artık git'te takip edilmiyor (eskiden yanlışlıkla commit'lenmişti); herkes kendi
  venv'ini oluşturur.

## Yeni Railway projesine geçiş (yapılacaklar)
Sırayla:
1. [ ] Yeni Railway projesi: **Postgres** + **backend** servisi (root dir `backend`, start komutu
       `Procfile`'dan gelir) + **frontend** servisi (root dir `frontend`). Kaynak repo `crmPrebably2`, branch `main`.
2. [ ] **Veriyi taşı:** Eski DB'den `pg_dump`, yeni DB'ye `pg_restore`/`psql`. Bu yapılmazsa kişiler,
       mesajlar, ödemeler, kullanıcılar ve **şifreli mail ayarları** boş gelir.
3. [ ] Backend env: eski Railway backend servisindeki tüm Variables'ı kopyala. `JWT_SECRET` **aynı**
       kalmalı (değişirse herkesin oturumu düşer ve DB'deki şifreli mail sırları çözülemez).
       `DATABASE_URL` yeni Postgres'e referans olmalı. `PUBLIC_BASE_URL` = yeni backend domaini.
4. [ ] Frontend env: `VITE_API_URL=https://<yeni-backend-domain>/api`. Build anında okunur;
       değiştirince frontend yeniden deploy edilmeli.
5. [ ] Backend env: `ALLOWED_ORIGINS=https://<yeni-frontend-domain>`.
6. [ ] Meta Developer panelinde Instagram webhook Callback URL'ini
       `https://<yeni-backend-domain>/api/webhook` yap (verify token = `WEBHOOK_VERIFY_TOKEN`).
7. [ ] Test: giriş, mesaj listesi, gelen DM'in düşmesi, seminer formu (`/f/:slug`), reklam senkronu.
8. [ ] Her şey çalışınca eski Railway projesini durdur. İkisi aynı anda açık kalırsa otomatik
       senkronlar iki DB'ye ayrı ayrı yazar ve veri ikiye bölünür.
9. [ ] `frontend/src/api.js` ve `backend/app/config.py` (`PUBLIC_BASE_URL`) içindeki eski domain
       fallback'lerini yeni domainle değiştir.

## Komutlar
- Backend: `uvicorn app.main:socket_app --reload` (`backend/` içinde). Giriş noktası `socket_app`;
  `app.main:app` kullanılırsa Socket.IO ve CORS sessizce bozulur. Prod: `Procfile`
  (`--loop uvloop --proxy-headers`; uvloop Windows'ta kurulmaz, sorun değil).
- Frontend: `npm run dev | build | preview | lint` (ESLint flat config).
- Test suite yok, backend linter yok.

## Mimari

### Backend (FastAPI + python-socketio + SQLAlchemy 2, Postgres)
- `app/main.py` katmanları: `FastAPI` → `socketio.ASGIApp` → `CORSMiddleware` = `socket_app`.
  Bu sıra korunmalı. `sio` (AsyncServer) `app.state.sio`'da; webhook handler'ları `app.main`'den
  import edip `new_message` emit eder. Socket bağlantısı JWT ister (`connect` → `decode_token`).
- **Şema yönetimi:** Alembic yok. `lifespan` içinde `Base.metadata.create_all` yeni tabloları
  oluşturur. Mevcut tablolara yeni kolon gerekiyorsa `lifespan`'daki idempotent
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` listesine ekle. Tek seferlik veri düzeltmeleri
  `app_meta` tablosundaki işaretçi anahtarıyla korunur. `backend/migration.sql` eski bir elle
  çalıştırılan migration'dır.
- `app/database.py`: `DATABASE_URL` yoksa import anında hata verir. `postgres://` ve
  `postgresql://` adreslerini `postgresql+psycopg://` olarak yeniden yazar (sürücü: **psycopg 3**).
- `app/config.py` tüm env'leri okur (dotenv). Oradaki MySQL `DATABASE_URL` default'u ölü koddur.
- Modeller tek dosyada: `app/models/__init__.py` (User, Status, Contact, Conversation, Message,
  ActivityLog, Reminder, QuickReply, Sector, TrainingSet, Creative, BankAccount, Payment, Company,
  MailSettings, AdAccount/AdSpend/AdCampaign/AdSyncState, SeminarForm/SeminarRegistration/
  Registration, BugReport/BugAttachment, ContactLink). `Contact.purchase_potential` Türkçe değerli
  bir Postgres ENUM; değerleri değişirse elle `ALTER TYPE` gerekir.
- Router'lar `app/api/*.py`, hepsi `/api` altında: auth, users, dashboard, webhook, messages,
  quick_replies, statuses, sectors, creatives, training_sets, bank_accounts, payments, advertising,
  issues, contacts, seminar_forms, public_forms, companies, mail_settings, system.
- Yetki: JWT (`app/auth.py`, 7 gün). Roller `user` / `admin`, ayrıca `OWNER_USERNAME` = owner.
- `app/services/`: `crypto.py` (anahtarı JWT_SECRET'tan türetilen Fernet; DB'de saklanan sırlar
  için), `email.py` (seminer kayıt e-postaları; Gmail OAuth/SMTP, ayarlar UI'dan DB'ye kaydedilir).
- Arka plan: `lifespan` her 30 dakikada bir Meta reklam otomatik senkronunu kontrol eder
  (`advertising.auto_sync_tick`).

### Meta / Instagram
- Uçtan uca bağlı olan tek kanal **Instagram Messaging**. WhatsApp env'leri var ama router yok.
- `GET /api/webhook` Meta doğrulama handshake'i, `POST /api/webhook` gelen DM'leri işler
  (Contact/Conversation/Message oluşturur, Socket.IO ile yayınlar). Kendi sayfa ID'mizden
  (`INSTAGRAM_PAGE_ID`) gelen echo'lar giden mesaj sayılır.
- `POST /api/sync-conversations`: Graph API ile geçmişi doldurur. Kesim tarihi `SYNC_CUTOFF_DATE`
  ama `webhook.py` içinde `datetime(2026, 5, 15)` sabiti de duruyor; ikisini birlikte kontrol et.
- `GET /api/conversations/{id}/window`: Meta'nın 24 saatlik mesajlaşma penceresi. Frontend cevap
  kutusunu bu endpoint'in `open` alanına göre açar/kapatır; bu davranış korunmalı.
- Reklam analizi: `META_ACCESS_TOKEN` + `META_AD_ACCOUNTS` (format `.env.example`'da).

### Frontend (React 19 + Vite 8 + Tailwind v4 + react-router 7)
- `src/App.jsx` sadece route tanımlarını içerir; sayfalar lazy yüklenir ve `src/pages/**` altında
  bulunur. Ortak bileşenler `src/components/`. Auth `AuthContext.jsx` + `ProtectedRoute.jsx`
  (`adminOnly`, `ownerOnly`). Tema `ThemeContext.jsx`.
- API istemcisi `src/api.js` (axios + Bearer token, 401 → /login). Adres `VITE_API_URL`'den gelir.
  `SOCKET_URL` bundan türetilir; socket şu an `MessagesPage` içinde kullanılıyor.
- Public route: `/f/:slug` (seminer kayıt formu, giriş gerektirmez).
- Tailwind v4 `@tailwindcss/vite` ile çalışır; `tailwind.config.js` yok.
- Arayüz metinleri Türkçe; yeni metinler de Türkçe olmalı.

### Deploy (Railway)
- Backend `backend/Procfile`, frontend `frontend/nixpacks.toml` (sadece `npm install`; build ve
  servis etme Nixpacks varsayılanlarıyla yapılır).
