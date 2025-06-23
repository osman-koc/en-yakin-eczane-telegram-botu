import 'dotenv/config';
import { getCityAndDistrictFromLocation } from '../services/openstreetmap-api.js';
import { fetchNearestPharmacies } from '../services/collect-api.js';
import { fetchPharmacies, appendUsageDataToGoogleSheets } from '../services/my-api.js';
import { findPharmaciesFromDb } from '../services/find-pharmacies.js';
import { isPublicHoliday } from '../services/holiday-api.js';
import queryString from 'query-string';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId, text, options = {}) {
  const payload = {
    chat_id: chatId,
    text,
    ...options,
  };
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const msg = req.body.message;
  if (!msg) {
    return res.status(200).json({ ok: true });
  }

  const chatId = msg.chat.id;
  const messageText = msg.text;
  const toLowerMessage = messageText?.toLowerCase();
  let responseMsg = '';

  try {
    if (msg && msg.location) {
      const messageDate = new Date(msg.date * 1000);
            const hours = messageDate.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false, hour: 'numeric' });

            const isWorkHour = hours >= 9 && hours < 18;
            const isWeekend = messageDate.getDay() === 0 || messageDate.getDay() === 6;
            const isHoliday = isPublicHoliday(messageDate);
            const willGoToDb = isWorkHour && !isWeekend && !isHoliday;
            const useCollectApi = process.env.USE_COLLECT_API === 'true';

            await sendMessage(chatId, 'Konum bilgisi sorgulanıyor.');
            let locationSuccess = false;

            const latitude = msg.location.latitude;
            const longitude = msg.location.longitude;

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
                        latitude: msg.location.latitude,
                        longitude: msg.location.longitude
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
                            await sendMessage(chatId, 'İlçenizdeki eczaneler listeleniyor.');
                        } else {
                            await sendMessage(chatId, 'Size en yakın olan nöbetçi eczaneler listeleniyor.');
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
                            await sendMessage(chatId, pharmacyItemMsg, { parse_mode: 'HTML' });
                            if (i < initialPharmacies.length - 1) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                        if (nearestPharmacies.length > 5) {
                            const remainingPharmacies = nearestPharmacies.slice(5);
                            const latLonPairs = remainingPharmacies
                                .map(p => `${p.location.lat}:${p.location.lon}`)
                                .join(',');
                            const encodedLatLons = Buffer.from(latLonPairs).toString('base64');

                            await sendMessage(chatId, `${city}/${district} için toplam ${nearestPharmacies.length} eczane bulundu. Diğer eczaneleri görmek için "Daha Fazla Göster" butonuna tıklayın.`, {
                                reply_markup: {
                                        inline_keyboard: [[{ text: 'Daha Fazla Göster', callback_data: `show_more_pharmacies:${encodedLatLons}` }]]
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
            await sendMessage(chatId, responseMsg, { parse_mode: 'HTML' });
        }
  } catch (error) {
    await sendMessage(chatId, 'Bir hata oluştu, lütfen tekrar deneyin.');
  }
  res.status(200).json({ ok: true });
}
