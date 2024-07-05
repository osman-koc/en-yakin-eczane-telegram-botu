import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { getCityAndDistrictFromLocation } from './api/openstreetmap-api.js';
// import { fetchNearestPharmacies } from './api/collect-api.js';
import { fetchPharmacies } from './api/my-api.js';
import { findPharmaciesFromDb } from './api/find-pharmacies.js';
import { isPublicHoliday } from './api/holiday-api.js';
import queryString from 'query-string';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const toLowerMessage = messageText?.toLowerCase();

    var responseMsg = '';

    if (msg && msg.location) {
        const messageDate = new Date(msg.date * 1000);
        const hours = messageDate.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false, hour: 'numeric' });

        const isWorkHour = hours >= 9 && hours < 18;
        const isWeekend = messageDate.getDay() === 0 || messageDate.getDay() === 6;
        const isHoliday = isPublicHoliday(messageDate);

        await bot.sendMessage(chatId, 'Konum bilginize göre en yakın eczaneler sorgulanıyor.');
        var locationSuccess = false;

        const latitude = msg.location.latitude;
        const longitude = msg.location.longitude;

        try {
            const { city, district } = await getCityAndDistrictFromLocation(latitude, longitude);
            console.log(`-> Request for: ${city} / ${district}`);
            if (city && district) {
                locationSuccess = true;

                const userLocation = {
                    latitude: msg.location.latitude,
                    longitude: msg.location.longitude
                };

                let nearestPharmacies;
                if (isWorkHour && !isWeekend && !isHoliday) {
                    nearestPharmacies = await findPharmaciesFromDb(city, district, userLocation);
                } else {
                    console.log(`-> Get API - hours:${hours}, isWorkHour:${isWorkHour}, isWeekend:${isWeekend}, isHoliday:${isHoliday}`);

                    // Collect API
                    // nearestPharmacies = await fetchNearestPharmacies(city, district, userLocation);
                    // MY API
                    nearestPharmacies = await fetchPharmacies(city, district);
                }

                if (nearestPharmacies.length > 0) {
                    if (isWorkHour){
                        await bot.sendMessage(chatId, 'İlçenizdeki eczaneler listeleniyor.');
                    } else {
                        await bot.sendMessage(chatId, 'Size en yakın olan nöbetçi eczaneler listeleniyor.');
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
                        await bot.sendMessage(chatId, pharmacyItemMsg, { parse_mode: 'HTML' });
                        if (i < initialPharmacies.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                    if (nearestPharmacies.length > 5) {
                        await bot.sendMessage(chatId, `${city}/${district} için toplam ${nearestPharmacies.length} eczane bulundu. Diğer eczaneleri görmek için "Tümünü Göster" butonuna tıklayın.`, {
                            reply_markup: {
                                inline_keyboard: [[{ text: 'Tümünü Göster', callback_data: 'show_more_pharmacies' }]]
                            }
                        });
                        // Save remaining pharmacies in a session variable or a temporary storage
                        bot.context = { remainingPharmacies: nearestPharmacies.slice(5) };
                    }
                } else {
                    responseMsg = 'Yakınınızda eczane bulunamadı.';
                }
            }
        } catch (error) {
            console.error('Konum bilgisi alınırken hata oluştu:', error);
            responseMsg = 'Konum bilgisi alınırken hata oluştu.';
        }

        if (!locationSuccess) {
            responseMsg = 'Konum bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.';
        }
    } else if (toLowerMessage === '/start' || toLowerMessage.includes('merhaba') || toLowerMessage.includes('selam')) {
        responseMsg = 'Hoş geldiniz!\n\nKonumunuzu bota gönderin ve size en yakın olan eczaneleri bulup göndersin.\n\nNot: Bilgileriniz hiçbir yerde kayıt edilmemektedir.';
    } else if (toLowerMessage === '/yardim' || toLowerMessage === '/help') {
        responseMsg = 'Bu bot konumunuza göre size en yakın eczane bilgilerini bulup göndermeye yarar. Bunun için mevcut konumunuzu bota göndermeniz yeterli. Konum bilginiz hiçbir yerde kayıt edilmemektedir.'
    } else if (toLowerMessage.includes('gelistirici') || toLowerMessage.includes('geliştirici') || toLowerMessage.includes('geliştiren') || toLowerMessage.includes('yazılımcı')) {
        responseMsg = 'Bu bot, Osman Koç tarafından geliştirildi. İletişim için info@osmkoc.com adresine mail atabilirsiniz.'
    } else if (toLowerMessage === 'ping') {
        responseMsg = 'pong';
    } else if (toLowerMessage === 'test') {
        responseMsg = 'Sensin test :)';
    } else {
        responseMsg = 'Mesajınız anlaşılamadı. Tekrar deneyiniz.'
    }

    if (responseMsg != '') {
        await bot.sendMessage(chatId, responseMsg, { parse_mode: 'HTML' });
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;

    if (callbackQuery.data === 'show_more_pharmacies') {
        const remainingPharmacies = bot.context?.remainingPharmacies || [];

        for (let i = 0; i < remainingPharmacies.length; i++) {
            const pharmacy = remainingPharmacies[i];
            const locationLink = `<a href="${pharmacy.googleMapsUrl}">Haritada göster</a>`;
            await bot.sendMessage(chatId, `Eczane adı: ${pharmacy.name}\nAdres: ${pharmacy.address}\nTelefon: ${pharmacy.phone}\n${locationLink}`, { parse_mode: 'HTML' });
            if (i < remainingPharmacies.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        bot.context = {};
    }
});