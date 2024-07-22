# En Yakın Eczane Telegram Botu

Bu proje, kullanıcının konumuna göre en yakın eczaneleri bulan ve Telegram botu olarak hizmet veren bir uygulamadır. Nöbetçi eczaneleri sorgulamak için Collect API'sini ve çalışma saatlerinde yerel veritabanını kullanır.

`./db/pharmacies.json` içerisinde Türkiye'deki tüm eczanelerin listesini bulabilirsiniz. Bu veri setini ayrıca projelerinizde (kaynak göstermek şartıyla) kullanabilirsiniz.

## Kullanım

Telegram hesabınız varsa kullanıcı arama kısmına `En Yakın Eczaneyi Bul` yazarak veya aşağıdaki linkten bota ulaşabilirsiniz:
https://t.me/EnYakinEczaneBot

<a href="https://t.me/EnYakinEczaneBot"><img src="./img/bot-logo.jpg" width="150" /></a>

## Başlangıç

Uygulamayı npm ile manuel olarak veya docker üzerinden pull edip run ederek çalıştırmanız mümkün.

### Gereksinimler

- NPM (manuel kurulum için) veya Docker
- Telegram bot token bilgisi
- Collect API token bilgisi

### Kurulum

#### Manuel Kurulum

1. Proje dizinine gidin ve bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

2. `.env.example` dosyasını `.env` olarak yeniden adlandırın ve aşağıdaki bilgileri düzenleyin:

   ```bash
   TELEGRAM_BOT_TOKEN=<your_telegram_bot_token>
   USE_COLLECT_API=true
   COLLECT_API_TOKEN=<your_collect_apikey>
   ...
   MY_API_URI=<customapiuri_youcanuse_collectapi_insteadofcustom>
   ```

   Buradaki `MY_API_URI` benim yazdığım başka bir servisin adresi. Bu servis, nöbetçi eczaneleri sunuyor. Henüz stabil olmadığından dolayı dış kullanıma açık değil, bu nedenle de burada bilgilerini paylaşamıyorum. Eğer kendi servisiniz varsa buraya onun adresini koyabilirsiniz. Tabii response için `./api/my-api.js` dosyasını düzenlemeyi unutmayın.

   Alternatif olarak, Collect API kullanabilirsiniz. Bunun için de <a href="https://collectapi.com/">collectapi.com</a> adresinde üye olup alacağınız token bilgisini COLLECT_API_TOKEN içerisine yapıştırın. Ardından <a href="https://collectapi.com/tr/api/health/nobetci-eczane-api">buradaki</a> adrese giderek "Ücretlendirme" sekmesinden istediğiniz bir pakete "Subscribe" yani abone olmanız gerekiyor. Bu işlemleri tamamladıktan sonra Collect API'daki nöbetçi eczane servisini kullanabilirsiniz. Bu zaten var olan bir servis, benim yaptığım bir şey değil.

   Eğer collect api kullanacaksanız `USE_COLLECT_API` değerini `true` olarak bırakın. Kendi servisinizi kullanacaksanız, bu değeri `false` olarak değiştirin.

3. Proje dizinine gidin ve bağımlılıkları yükleyin:

   ```bash
   npm run start
   ```

#### Docker Kullanarak

Repo'yu indirerek Dockerfile üzerinden yapmak için manuel kurulumdaki env adımını aynı şekilde uygulamalısınız.

1. Proje dizinine gidin ve Docker imajını oluşturun:

   ```bash
   docker build -t en-yakin-eczane-telegram-botu .
   ```

2. Docker imajını çalıştırın:

   ```bash
   docker run -d --name eczane-botu en-yakin-eczane-telegram-botu
   ```

Repo'yu indirmeden Docker Hub üzerinden image'ı indirip çalıştırmak için:

   ```bash
   docker run -d \
   -e TELEGRAM_BOT_TOKEN="<token_degerini_buraya_girin>" \
   -e COLLECT_API_TOKEN="<token_degerini_buraya_girin>" \
   byengineer/en-yakin-eczane-telegram-botu:master
   ```

## Kullanım

Kendi botunuzu kullanmak için:
- Telegram'da oluşturduğunuz botunuzu bulun.
- Bota "/start" veya kendi ayarladığınız başlangıç komutunu gönderip çalıştığından emin olun.
- Başarılı şekilde cevap alabilirseniz şimdi de konum bilginizi göndererek eczaneleri bilgilerini almayı deneyebilirsiniz.
- Eğer mesai saatleri içerisinde iseniz, ilçenizdeki eczanelerin bir kısmını verip "Tümünü Göster" butonu getirecektir. Bu butona tıklayarak tüm eczane bilgilerini listeleyebilirsiniz.

Benim oluşturduğum botu deneyimlemek için https://t.me/EnYakinEczaneBot adresinden botu kullanabilirsiniz.

## Katkıda Bulunma

Kodu iyileştirmek, varsa bir hatayı gidermek veya yeni özellikler katmak isterseniz repo'yu clone'layın ve geliştirme sonrası bir Pull Request oluşturun. Desteğiniz için şimdiden teşekkür ederim.


