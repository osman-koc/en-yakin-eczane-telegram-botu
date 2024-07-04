# En Yakın Eczane Telegram Botu

Bu proje, kullanıcının konumuna göre en yakın eczaneleri bulan ve Telegram botu olarak hizmet veren bir uygulamadır. Nöbetçi eczaneleri sorgulamak için Collect API'sini ve çalışma saatlerinde yerel veritabanını kullanır.

`./db/pharmacies.json` içerisinde Türkiye'deki tüm eczanelerin listesini bulabilirsiniz. Bu veri setini ayrıca projelerinizde (kaynak göstermek şartıyla) kullanabilirsiniz.

## Kullanım

Telegram hesabınız varsa kullanıcı arama kısmına `En Yakın Eczaneyi Bul` yazarak veya aşağıdaki linkten bota ulaşabilirsiniz:
https://t.me/EnYakinEczaneBot

<a href="https://t.me/EnYakinEczaneBot"><img src="./img/bot-logo.png" width="150" /></a>

## Başlangıç

### Gereksinimler

- Docker
- Docker Compose (opsiyonel)

### Kurulum

#### Docker Kullanarak

1. Proje dizinine gidin ve Docker imajını oluşturun:

   ```bash
   docker build -t en-yakin-eczane-botu .
   ```

2. Docker imajını çalıştırın:

   ```bash
   docker run -d --name eczane-botu en-yakin-eczane-botu
   ```

#### Manuel Kurulum

1. Proje dizinine gidin ve bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

2. `.env` dosyasını oluşturun ve aşağıdaki bilgileri ekleyin:

   ```bash
   TELEGRAM_BOT_TOKEN=<your_telegram_bot_token>
   COLLECT_API_TOKEN=<your_collect_apikey>
   COLLECT_API_URI=https://api.collectapi.com/health/dutyPharmacy
   OPENSTREETMAP_URI=https://nominatim.openstreetmap.org/reverse
   ```

3. Proje dizinine gidin ve bağımlılıkları yükleyin:

   ```bash
   npm run start
   ```

## Kullanım
- Telegram'da botunuzu bulun ve /start komutunu gönderin.
- Konumunuzu paylaşın ve bot size en yakın eczaneleri göndersin.
- "Tümünü Göster" butonuna basarak daha fazla eczane bilgisine erişin.

## Katkıda Bulunma
Katkıda bulunmak için lütfen bir pull request oluşturun.
