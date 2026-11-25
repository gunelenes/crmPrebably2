"""
Reklam sayfaları (Reklam Analizi, Kampanya Durumları, Grafikler) için TEST verisi üretir.

Kullanım (backend/ klasöründe, venv aktifken):
    python seed_test_ads.py act_1187157688883384      # test verisi ekle (önce eskisini siler)
    python seed_test_ads.py act_1187157688883384 --temizle   # sadece test verisini sil

- Hesap, Parametreler → Reklam Hesapları'nda tanımlı olmalı (yoksa sayfalar göstermez).
- Tüm test satırları işaretlidir: ad_spend.source='test', adset/kampanya id'leri 'test_' önekli,
  registrations.source='test'. Gerçek veriye dokunulmaz.
- Gerçek META_ACCESS_TOKEN ile senkron çalışınca test kampanyaları (ad_campaigns) otomatik
  silinir; ad_spend ve registrations test satırları kalır → --temizle ile silin.
- DATABASE_URL backend/.env'den okunur. CANLI veritabanına karşı çalıştırmayın.
"""

import json
import os
import random
import sys
from datetime import date, datetime, timedelta

import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

DAYS = 90
SEED = 42

# (id, ad, kanal, amaç(objective), Meta durumu, sorun açıklaması, sonuç türü,
#  günlük bütçe TL, sonuç başı maliyet TL, bitiş: kaç gün önce durdu (None = sürüyor),
#  başlangıç: kaç gün önce başladı, reklam setleri)
CAMPAIGNS = [
    ("test_c1", "Kasım Seminer DM — Instagram", "instagram", "OUTCOME_ENGAGEMENT", "ACTIVE", None,
     "messaging_conversation_started", 650, 38, None, 45,
     [("test_c1_s1", "25-44 Kadın İstanbul"), ("test_c1_s2", "25-44 Karma Ankara/İzmir")]),
    ("test_c2", "WhatsApp Bilgi Talebi", "whatsapp", "OUTCOME_ENGAGEMENT", "ACTIVE", None,
     "messaging_conversation_started", 400, 29, None, 80,
     [("test_c2_s1", "Geniş Kitle TR"), ("test_c2_s2", "Benzer Kitle %1 — Müşteriler")]),
    ("test_c3", "Wix Seminer Kayıt — Trafik", "facebook", "OUTCOME_TRAFFIC", "ACTIVE", None,
     "link_click", 500, 4.2, None, 90,
     [("test_c3_s1", "İlgi: Kişisel Gelişim"), ("test_c3_s2", "Yeniden Hedefleme 30 Gün")]),
    ("test_c4", "Ekim Eğitim Seti Tanıtım", "instagram", "OUTCOME_ENGAGEMENT", "PAUSED", None,
     "messaging_conversation_started", 550, 45, 21, 75,
     [("test_c4_s1", "25-54 TR Geneli")]),
    ("test_c5", "Black Friday Kampanyası", "instagram", "OUTCOME_ENGAGEMENT", "WITH_ISSUES",
     "Reklam teslimatı sınırlı: Ödeme yöntemi limitine ulaşıldı",
     "messaging_conversation_started", 900, 52, 3, 12,
     [("test_c5_s1", "Sepet Terk — Yeniden Hedefleme"), ("test_c5_s2", "Geniş Kitle 18-45")]),
    ("test_c6", "Ücretsiz Webinar Duyurusu", "facebook", "OUTCOME_TRAFFIC", "PENDING_REVIEW", None,
     "link_click", 300, 3.5, None, 0,
     [("test_c6_s1", "İlgi: Online Eğitim")]),
    ("test_c7", "Yaz Dönemi Kayıtları", "instagram", "OUTCOME_LEADS", "DISAPPROVED",
     "Reklam politikası: Gerçekçi olmayan sonuç vaadi (\"30 günde garanti\") — metni düzenleyin",
     "messaging_conversation_started", 350, 41, 40, 60,
     [("test_c7_s1", "18-35 Öğrenci")]),
]

SEMINARS = ["Kasım Online Seminer", "Aralık Yüz Yüze Seminer — İstanbul", "Ücretsiz Tanışma Webinarı"]
FIRST = ["Ayşe", "Mehmet", "Zeynep", "Ahmet", "Elif", "Mustafa", "Fatma", "Emre", "Selin", "Burak",
         "Deniz", "Can", "Merve", "Oğuz", "Ece", "Kerem", "Büşra", "Serkan", "Gizem", "Hakan"]
LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan"]


def connect():
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        sys.exit("DATABASE_URL yok (backend/.env).")
    if "crm-prebably-production" in url:
        sys.exit("Canlı veritabanı gibi görünüyor, iptal edildi.")
    return psycopg.connect(url)


def clean(c, act_id):
    s = c.execute("DELETE FROM ad_spend WHERE account_act_id=%s AND source='test'", (act_id,)).rowcount
    k = c.execute("DELETE FROM ad_campaigns WHERE account_act_id=%s AND campaign_id LIKE 'test\\_%%'",
                  (act_id,)).rowcount
    r = c.execute("DELETE FROM registrations WHERE source='test'").rowcount
    return s, k, r


def seed(c, act_id, acc_name, purpose):
    rnd = random.Random(SEED)
    today = date.today()
    now = datetime.utcnow()
    spend_rows = 0

    for (cid, cname, channel, objective, status, issues, rtype, budget, cpr,
         stopped_ago, started_ago, adsets) in CAMPAIGNS:
        c.execute(
            """INSERT INTO ad_campaigns (account_act_id, account_name, campaign_id, campaign_name,
                   objective, configured_status, effective_status, issues, updated_at, synced_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (act_id, acc_name, cid, cname, objective,
             "PAUSED" if status == "PAUSED" else "ACTIVE", status, issues, now, now))

        for day_ago in range(min(started_ago, DAYS), 0, -1):
            if stopped_ago is not None and day_ago <= stopped_ago:
                continue
            d = today - timedelta(days=day_ago - 1)
            weekend = d.weekday() >= 5
            trend = 1 + 0.25 * (1 - day_ago / DAYS)          # zamanla hafif artan bütçe
            for i, (sid, sname) in enumerate(adsets):
                share = 0.6 if (i == 0 and len(adsets) > 1) else (0.4 if len(adsets) > 1 else 1.0)
                spend = budget * share * trend * rnd.uniform(0.75, 1.2) * (0.85 if weekend else 1)
                eff = cpr * rnd.uniform(0.7, 1.45) * (1.15 if weekend else 1)
                results = max(0, int(round(spend / eff)))
                impressions = int(spend * rnd.uniform(55, 95))
                reach = int(impressions * rnd.uniform(0.62, 0.85))
                clicks = (results + int(results * rnd.uniform(0.05, 0.2))) if rtype == "link_click" \
                    else int(impressions * rnd.uniform(0.008, 0.02))
                c.execute(
                    """INSERT INTO ad_spend (account_act_id, account_name, purpose, date, campaign_id,
                           campaign_name, adset_id, adset_name, channel, objective, spend, impressions,
                           clicks, reach, results, result_type, currency, source, synced_at)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'TRY','test',%s)""",
                    (act_id, acc_name, purpose, d, cid, cname, sid, sname, channel, objective,
                     round(spend, 2), impressions, clicks, reach, results, rtype, now))
                spend_rows += 1

    # Wix seminer kayıtları (CPA için) — trafik kampanyasıyla orantılı, kişiye eşleşmemiş.
    reg_rows = 0
    for day_ago in range(DAYS, 0, -1):
        d = today - timedelta(days=day_ago - 1)
        for _ in range(rnd.choice([0, 0, 1, 1, 1, 2, 2, 3])):
            fn, ln = rnd.choice(FIRST), rnd.choice(LAST)
            reg_rows += 1
            ts = datetime.combine(d, datetime.min.time()) + timedelta(minutes=rnd.randint(480, 1380))
            email = f"{fn}.{ln}{reg_rows}@ornek.com".lower().replace("ı", "i").replace("ş", "s") \
                .replace("ç", "c").replace("ğ", "g").replace("ö", "o").replace("ü", "u")
            phone = f"+90 5{rnd.randint(30, 59)} {rnd.randint(100, 999)} {rnd.randint(10, 99)} {rnd.randint(10, 99)}"
            seminar = rnd.choice(SEMINARS)
            c.execute(
                """INSERT INTO registrations (name, email, phone, seminar, registered_at, source,
                       dedup_key, raw, uploaded_at)
                   VALUES (%s,%s,%s,%s,%s,'test',%s,%s,%s)""",
                (f"{fn} {ln}", email, phone, seminar, ts, f"test_{reg_rows}",
                 json.dumps({"not": "test verisi"}, ensure_ascii=False), now))
    return spend_rows, len(CAMPAIGNS), reg_rows


def main():
    if len(sys.argv) < 2 or not sys.argv[1].startswith("act_"):
        sys.exit(__doc__)
    act_id = sys.argv[1]
    with connect() as c, c.transaction():
        row = c.execute("SELECT name, purpose FROM ad_accounts WHERE act_id=%s", (act_id,)).fetchone()
        if not row:
            sys.exit(f"{act_id} Parametreler → Reklam Hesapları'nda tanımlı değil.")
        s, k, r = clean(c, act_id)
        print(f"Silinen eski test verisi: {s} harcama satırı, {k} kampanya, {r} kayıt")
        if "--temizle" in sys.argv:
            return
        s, k, r = seed(c, act_id, row[0], row[1] or "genel")
        print(f"Eklenen: {k} kampanya, {s} günlük harcama satırı ({DAYS} gün), {r} seminer kaydı")


if __name__ == "__main__":
    main()
