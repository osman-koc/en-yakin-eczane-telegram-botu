import 'dotenv/config';
import { getCityAndDistrictFromLocation } from '../services/openstreetmap-api.js';
import { fetchNearestPharmacies } from '../services/collect-api.js';
import { fetchPharmacies, appendUsageDataToGoogleSheets } from '../services/my-api.js';
import { findPharmaciesFromDb } from '../services/find-pharmacies.js';
import { isPublicHoliday } from '../services/holiday-api.js';
import queryString from 'query-string';
import { Bot, webhookCallback, session } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Session için başlangıç yapısı
function initialSession() {
  return {
    remainingPharmacies: [],
    timestamp: 0
  };
}

bot.use(session({
  initial: initialSession
}));

export default webhookCallback(bot, 'http');

// Mesaj handler
bot.on('message', async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text;
    const toLowerMessage = messageText?.toLowerCase();
    let responseMsg = '';

    if (ctx.message.location) {
      const messageDate = new Date(ctx.message.date * 1000);
      const hours = messageDate.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false, hour: 'numeric' });

      const isWorkHour = hours >= 9 && hours < 18;
      const isWeekend = messageDate.getDay() === 0 || messageDate.getDay() === 6;
      const isHoliday = isPublicHoliday(messageDate);
      const willGoToDb = isWorkHour && !isWeekend && !isHoliday;
      const useCollectApi = process.env.USE_COLLECT_API === 'true';

      await ctx.reply('Konum bilgisi sorgulanıyor.');
      let locationSuccess = false;

      const latitude = ctx.message.location.latitude;
      const longitude = ctx.message.location.longitude;

      try {
        const { country_code, city, district } = await getCityAndDistrictFromLocation(latitude, longitude);
        if (!country_code || country_code.toLowerCase() !== 'tr') {
          locationSuccess = true;
          responseMsg = 'Konumunuz Türkiye dışındaki bir ülke olarak tespit edildi. Servisimiz şu an için yalnızca Türkiye içerisindeki eczaneler için hizmet vermektedir. İlginiz için teşekkür ederiz.';
        }
        else if (city && district) {
          console.log(`-> Request for: ${city} / ${district}`);

          locationSuccess = true;

          const userLocation = {
            latitude: ctx.message.location.latitude,
            longitude: ctx.message.location.longitude
          };

          async function getDataFromCollectApi() {
            console.log(`-> Get CollectAPI - hours:${hours}, isWorkHour:${isWorkHour}, isWeekend:${isWeekend}, isHoliday:${isHoliday}`);
            nearestPharmacies = await fetchNearestPharmacies(city, district, userLocation);
          }

          let nearestPharmacies;
          if (willGoToDb) {
            nearestPharmacies = await findPharmaciesFromDb(city, district, userLocation);
          } else {
            if (useCollectApi) {
              // Collect API
              await getDataFromCollectApi();
            } else {
              // MY API
              console.log(`-> Get MyAPI - hours:${hours}, isWorkHour:${isWorkHour}, isWeekend:${isWeekend}, isHoliday:${isHoliday}`);
              try {
                nearestPharmacies = await fetchPharmacies(city, district);
              } catch (error) {
                console.log(error);
                await getDataFromCollectApi();
              }
            }
          }

          if (nearestPharmacies && nearestPharmacies.length > 0) {
            if (willGoToDb) {
              await ctx.reply('İlçenizdeki eczaneler listeleniyor.');
            } else {
              await ctx.reply('Size en yakın olan nöbetçi eczaneler listeleniyor.');
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            const initialPharmacies = nearestPharmacies.slice(0, 5);
            for (let i = 0; i < initialPharmacies.length; i++) {
              const pharmacy = initialPharmacies[i];
              var pharmacyItemMsg = `Eczane adı: ${pharmacy.name}\nAdres: ${pharmacy.address}\nTelefon: ${pharmacy.phone}\n`;

              if (pharmacy.googleMapsUrl === undefined || pharmacy.googleMapsUrl === null || pharmacy.googleMapsUrl.length < 10) {
                const addressQuery = queryString.stringify({ query: pharmacy.address });
                pharmacy.googleMapsUrl = `${process.env.GOOGLE_MAPS_URI}&${addressQuery}`;
              }

              pharmacyItemMsg += `<a href="${pharmacy.googleMapsUrl}">Haritada göster</a>`;
              await ctx.reply(pharmacyItemMsg, { parse_mode: 'HTML' });
              if (i < initialPharmacies.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            if (nearestPharmacies.length > 5) {
              const remainingPharmacies = nearestPharmacies.slice(5);
              const pharmacyData = {
                pharmacies: remainingPharmacies,
                city,
                district
              };
              ctx.session.remainingPharmacies = remainingPharmacies;
              ctx.session.timestamp = Date.now();

              await ctx.reply(`${city}/${district} için toplam ${nearestPharmacies.length} eczane bulundu. Diğer eczaneleri görmek için "Daha Fazla Göster" butonuna tıklayın.`, {
                reply_markup: {
                  inline_keyboard: [[{ text: 'Daha Fazla Göster', callback_data: 'show_more_pharmacies' }]]
                }
              });
            }
          } else {
            responseMsg = 'Yakınınızda eczane bulunamadı veya konum bilgisinde bir hata var.';
          }

          try {
            if (process.env.MY_API_URI) {
              const rowData = {
                date: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                chatId,
                city,
                district
              };
              await appendUsageDataToGoogleSheets(rowData);
            }
          } catch (error) { }
        }
      } catch (error) {
        console.error('Hata oluştu:', error);
        responseMsg = 'Servislerde oluşan bir hatadan dolayı şu anda isteğinize yanıt alamadım. Konumu doğru gönderdiğinizden eminseniz tekrar deneyebilirsiniz.';
      }

      if (!locationSuccess) {
        responseMsg = 'Konum bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.';
      }
    } else if (toLowerMessage === '/start' || toLowerMessage.includes('merhaba') || toLowerMessage.includes('selam')) {
      responseMsg = 'Hoş geldiniz!\n\nKonumunuzu bota gönderin ve size en yakın olan eczaneleri bulup göndersin.\n\nNot: Bilgileriniz hiçbir yerde kayıt edilmemektedir.';
    } else if (toLowerMessage === '/yardim' || toLowerMessage === '/help') {
      responseMsg = 'Bu bot konumunuza göre size en yakın eczane bilgilerini bulup göndermeye yarar. Bunun için mevcut konumunuzu bota göndermeniz yeterli. Konum bilginiz hiçbir yerde kayıt edilmemektedir.'
    } else if (toLowerMessage === '/developer') {
      responseMsg = 'Bu bot [Osman Koç](https://osmankoc.dev/) tarafından geliştirilmiştir.\n\nEğer bir sorun yaşıyorsanız veya öneriniz varsa info@osmankoc.dev adresine mail olarak iletebilirsiniz.';
    } else if (toLowerMessage === '/contact') {
      responseMsg = 'Bir hata veya öneri bildirmek isterseniz info@osmankoc.dev adresine mail gönderebilirsiniz. Şimdiden teşekkürler!'
    } else if (toLowerMessage === 'ping') {
      responseMsg = 'pong';
    } else if (toLowerMessage === 'test') {
      responseMsg = 'Sensin test :)';
    } else if (toLowerMessage.includes('naber') || toLowerMessage.includes('nasılsın')) {
      responseMsg = 'Size yardımcı olmakla meşgulüm. Ben bir chat botu değil, size yakın olan eczaneleri bulup iletmekle görevliyim. Bu nedenle bu tarz sorularınıza yanıt veremeyebilirim. İlginiz için teşekkür ederim.';
    }

    if (responseMsg !== '') {
      await ctx.reply(responseMsg, { parse_mode: 'HTML' });
    }
  } catch (error) {
    console.error(error);
    await ctx.reply('Bir hata oluştu, lütfen tekrar deneyin.');
  }
});

// Callback handler
bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const now = Date.now();

  if (data === 'show_more_pharmacies') {
    if (!ctx.session.remainingPharmacies || ctx.session.remainingPharmacies.length === 0) {
      await ctx.reply('Geçici bellek temizlendi. Lütfen konumunuzu tekrar gönderin.');
      return;
    }

    if (!ctx.session.timestamp || now - ctx.session.timestamp > 30 * 60 * 1000) {
      ctx.session.remainingPharmacies = [];
      ctx.session.timestamp = 0;
      await ctx.reply('Geçici bellek temizlendi. Lütfen konumunuzu tekrar gönderin.');
      return;
    }

    const remainingPharmacies = ctx.session.remainingPharmacies;
    ctx.session.remainingPharmacies = remainingPharmacies.slice(5);
    ctx.session.timestamp = now;

    for (let i = 0; i < Math.min(5, remainingPharmacies.length); i++) {
      const pharmacy = remainingPharmacies[i];
      var pharmacyItemMsg = `Eczane adı: ${pharmacy.name}\nAdres: ${pharmacy.address}\nTelefon: ${pharmacy.phone}\n`;

      if (!pharmacy.googleMapsUrl || pharmacy.googleMapsUrl.length < 10) {
        const addressQuery = queryString.stringify({ query: pharmacy.address });
        pharmacy.googleMapsUrl = `${process.env.GOOGLE_MAPS_URI}&${addressQuery}`;
      }

      pharmacyItemMsg += `<a href="${pharmacy.googleMapsUrl}">Haritada göster</a>`;
      await ctx.reply(pharmacyItemMsg, { parse_mode: 'HTML' });
      if (i < Math.min(5, remainingPharmacies.length) - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (ctx.session.remainingPharmacies.length > 0) {
      await ctx.reply('Daha fazla eczane görmek için tekrar "Daha Fazla Göster" butonuna tıklayın.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Daha Fazla Göster', callback_data: 'show_more_pharmacies' }]]
        }
      });
    } else {
      ctx.session.remainingPharmacies = [];
      ctx.session.timestamp = 0;
    }
  }
});
