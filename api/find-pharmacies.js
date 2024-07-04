import 'dotenv/config';
import geolib from 'geolib';
import queryString from 'query-string';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pharmaciesFile = resolve(__dirname, '../db/pharmacies.json');
const pharmaciesData = JSON.parse(readFileSync(pharmaciesFile, 'utf8'));

// Kullanıcı konumunu alıp il ve ilçeye göre eczaneleri bulan fonksiyon
async function findPharmaciesFromDb(city, district, userLocation) {
    const upperCaseCity = city.toLocaleUpperCase('tr');
    const upperCaseDistrict = district.toLocaleUpperCase('tr');

    // Eczaneleri il ve ilçe bilgisine göre filtrele
    const filteredPharmacies = pharmaciesData.filter(pharmacy =>
        pharmacy.city.toLocaleUpperCase('tr') === upperCaseCity &&
        pharmacy.district.toLocaleUpperCase('tr') === upperCaseDistrict
    );

    // Her eczane için merkezden uzaklık hesapla ve sırala
    const pharmaciesWithDistances = filteredPharmacies.map(pharmacy => {
        const pharmacyLocation = {
            latitude: parseFloat(pharmacy.lat),
            longitude: parseFloat(pharmacy.lon)
        };

        const googleBaseUrl = 'https://www.google.com/maps/search/?api=1';
        const addressQuery = queryString.stringify({ query: pharmacy.address });
        const googleMapsUrl = `${googleBaseUrl}&${addressQuery}`;

        const distance = geolib.getDistance(userLocation, pharmacyLocation); // metre cinsinden uzaklık
        return { ...pharmacy, distance, googleMapsUrl };
    });

    // Uzaklığa göre sırala
    pharmaciesWithDistances.sort((a, b) => a.distance - b.distance);

    return pharmaciesWithDistances;
}

export { findPharmaciesFromDb };
