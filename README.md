# En Yakın Eczane Telegram Botu

Bu proje, kullanıcının konumuna göre en yakın eczaneleri bulan ve Telegram botu olarak hizmet veren bir uygulamadır. Mesai saatlerinde (hafta içi 09:00–18:00, resmi tatil günleri hariç) yerel veritabanını, diğer zamanlarda ise nöbetçi eczane sorgusunu (Collect API veya özel API) kullanır.

`./db/pharmacies.json` içerisinde Türkiye'deki tüm eczanelerin listesini bulabilirsiniz. Bu veri setini ayrıca projelerinizde (kaynak göstermek şartıyla) kullanabilirsiniz.

## Canlı Bot

Telegram hesabınız varsa kullanıcı arama kısmına `En Yakın Eczaneyi Bul` yazarak veya aşağıdaki linkten bota ulaşabilirsiniz:
https://t.me/EnYakinEczaneBot

<a href="https://t.me/EnYakinEczaneBot"><img src="./img/bot-logo.jpg" width="150" /></a>

## Nasıl Çalışır?

1. Kullanıcı Telegram üzerinden konum bilgisini bota iletir.
2. Bot, OpenStreetMap Nominatim API aracılığıyla koordinatları il/ilçeye dönüştürür.
3. Mesai saatlerinde (`hafta içi 09:00–18:00`, resmi tatil değilse) konum ilçesindeki tüm eczaneler yerel veritabanından (`./db/pharmacies.json`) listelenir ve en yakından uzağa sıralanır.
4. Mesai saatleri dışında nöbetçi eczaneler Collect API veya özel API üzerinden sorgulanır.
5. İlk 5 eczane doğrudan listelenir; daha fazlası varsa **"Daha Fazla Göster"** butonu sunulur.

## Başlangıç

Uygulamayı Node.js ile manuel olarak veya Docker üzerinden çalıştırabilirsiniz.

### Gereksinimler

- **Node.js 20+** ve npm (manuel kurulum için)
- **Docker** (Docker ile kurulum için)
- Telegram bot token'ı ([BotFather](https://t.me/BotFather) üzerinden alınır)
- Collect API token'ı (nöbetçi eczane sorgusu için, isteğe bağlı)

### Kurulum

#### Manuel Kurulum

1. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

2. Proje dizininde bir `.env` dosyası oluşturun ve aşağıdaki değişkenleri düzenleyin:

   ```env
   TELEGRAM_BOT_TOKEN=<telegram_bot_tokeniniz>

   # Nöbetçi eczane API seçimi
   # true  → Collect API kullanılır
   # false → MY_API_URI ile tanımlanan özel API kullanılır
   USE_COLLECT_API=true

   # Collect API (https://collectapi.com)
   COLLECT_API_TOKEN=<collect_api_tokeniniz>
   COLLECT_API_URI=https://api.collectapi.com/health/dutyPharmacy

   # Özel API (USE_COLLECT_API=false ise kullanılır)
   MY_API_URI=<ozel_api_adresi>
   MY_API_KEY=<ozel_api_anahtari>

   # Dış servisler (varsayılan değerler aşağıdadır)
   OPENSTREETMAP_URI=https://nominatim.openstreetmap.org/reverse
   GOOGLE_MAPS_URI=https://www.google.com/maps/search/?api=1
   ```

   > **Collect API hakkında:** [collectapi.com](https://collectapi.com) adresinde üye olup token alın, ardından [Nöbetçi Eczane API](https://collectapi.com/tr/api/health/nobetci-eczane-api) sayfasından bir pakete abone olun.
   >
   > **Özel API hakkında:** Kendi nöbetçi eczane servisiniz varsa `MY_API_URI` ve `MY_API_KEY` değerlerini doldurun; `USE_COLLECT_API` değerini `false` yapın. Response formatı için `./services/my-api.js` dosyasını güncellemeyi unutmayın.

3. Botu başlatın:

   ```bash
   npm start
   ```

#### Docker Kullanarak

**Repo'dan imaj oluşturup çalıştırmak için:**

1. Docker imajını derleyin (multi-stage, distroless runtime):

   ```bash
   docker build -t en-yakin-eczane-telegram-botu .
   ```

2. İmajı çalıştırın:

   ```bash
   docker run -d --name eczane-botu \
     -e TELEGRAM_BOT_TOKEN="<telegram_bot_tokeniniz>" \
     -e USE_COLLECT_API="true" \
     -e COLLECT_API_TOKEN="<collect_api_tokeniniz>" \
     en-yakin-eczane-telegram-botu
   ```

**Docker Hub üzerinden hazır imajı indirip çalıştırmak için:**

   ```bash
   docker run -d --name eczane-botu \
     -e TELEGRAM_BOT_TOKEN="<telegram_bot_tokeniniz>" \
     -e USE_COLLECT_API="true" \
     -e COLLECT_API_TOKEN="<collect_api_tokeniniz>" \
     byengineer/en-yakin-eczane-telegram-botu:master
   ```

## Kullanım

Kendi botunuzu ayağa kaldırdıktan sonra:

1. Telegram'da oluşturduğunuz botu açın ve `/start` mesajı gönderin.
2. Konum paylaş butonunu kullanarak mevcut konumunuzu bota iletin.
3. Bot, bulunduğunuz il/ilçeye göre en yakın eczaneleri listeler.
   - **Mesai saati içindeyseniz:** İlçenizdeki tüm eczaneler yerel veritabanından listelenir.
   - **Mesai saati dışındaysanız:** Nöbetçi eczaneler API üzerinden sorgulanır.
4. İlk 5 eczane listelenir; daha fazlası varsa **"Daha Fazla Göster"** butonuna tıklayarak geri kalan eczaneleri görebilirsiniz.

## Proje Yapısı

```
├── bot.js                    # Uygulama giriş noktası
├── Dockerfile                # Multi-stage Docker build (distroless runtime)
├── api/
│   └── webhook.js            # Bot mesaj & callback handler'ları
├── db/
│   ├── pharmacies.json       # Türkiye eczane veritabanı
│   └── holidays.json         # Resmi tatil günleri
└── services/
    ├── collect-api.js        # Collect API entegrasyonu (nöbetçi)
    ├── find-pharmacies.js    # Yerel DB'den eczane arama ve mesafe hesabı
    ├── holiday-api.js        # Resmi tatil kontrolü
    ├── logger.js             # Loglama servisi
    ├── my-api.js             # Özel API entegrasyonu
    └── openstreetmap-api.js  # Koordinat → il/ilçe dönüşümü
```

## Katkıda Bulunma

Kodu iyileştirmek, bir hatayı gidermek veya yeni özellikler eklemek isterseniz repo'yu fork'layın ve geliştirme sonrası bir Pull Request oluşturun. Desteğiniz için şimdiden teşekkür ederim.


