import 'dotenv/config';
import geolib from 'geolib';
import queryString from 'query-string';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kullanıcı konumunu alıp il ve ilçeye göre eczaneleri bulan fonksiyon
async function findPharmaciesFromDb(city, district, userLocation) {
    const upperCaseCity = city.toLocaleUpperCase('tr');
    const upperCaseDistrict = district.toLocaleUpperCase('tr');

    // JSON dosyasını her çağrıldığında yeniden oku (doğru path ile)
    const pharmaciesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/pharmacies.json'), 'utf-8'));

    // Eczaneleri il ve ilçe bilgisine göre filtrele
    const filteredPharmacies = pharmaciesData.filter(pharmacy =>
        pharmacy.city.toLocaleUpperCase('tr') === upperCaseCity &&
        pharmacy.district.toLocaleUpperCase('tr') === upperCaseDistrict
    );

    // Her eczane için merkezden uzaklık hesapla ve sırala
    const pharmaciesWithDistances = filteredPharmacies.map(pharmacy => {
        const pharmacyLocation = {
            latitude: parseFloat(pharmacy.location.lat),
            longitude: parseFloat(pharmacy.location.lon)
        };
        //console.log(pharmacyLocation);

        const addressQuery = queryString.stringify({ query: pharmacy.address });
        const googleMapsUrl = `${process.env.GOOGLE_MAPS_URI}&${addressQuery}`;

        const distance = geolib.getDistance(userLocation, pharmacyLocation); // metre cinsinden uzaklık
        return { ...pharmacy, distance, googleMapsUrl };
    });

    // Uzaklığa göre sırala
    pharmaciesWithDistances.sort((a, b) => a.distance - b.distance);

    return pharmaciesWithDistances;
}

export { findPharmaciesFromDb };
