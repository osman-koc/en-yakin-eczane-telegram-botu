require('dotenv').config();
const geolib = require('geolib');
const pharmacies = require('../db/pharmacies.json');

// Kullanıcı konumunu alıp il ve ilçeye göre eczaneleri bulan fonksiyon
async function findPharmaciesFromDb(city, district, userLocation) {
    const upperCaseCity = city.toLocaleUpperCase('tr');
    const upperCaseDistrict = district.toLocaleUpperCase('tr');

    console.log('Kullanıcının bulunduğu il/ilçe:', upperCaseCity, upperCaseDistrict);

    // Eczaneleri il ve ilçe bilgisine göre filtrele
    const filteredPharmacies = pharmacies.filter(pharmacy =>
        pharmacy.city.toLocaleUpperCase('tr') === upperCaseCity &&
        pharmacy.district.toLocaleUpperCase('tr') === upperCaseDistrict
    );

    console.log('Bulunan eczane sayısı:', filteredPharmacies.length);

    // Her eczane için merkezden uzaklık hesapla ve sırala
    const pharmaciesWithDistances = filteredPharmacies.map(pharmacy => {
        const pharmacyLocation = {
            latitude: parseFloat(pharmacy.lat),
            longitude: parseFloat(pharmacy.lon)
        };
        const distance = geolib.getDistance(userLocation, pharmacyLocation); // metre cinsinden uzaklık
        return { ...pharmacy, distance };
    });

    // Uzaklığa göre sırala
    pharmaciesWithDistances.sort((a, b) => a.distance - b.distance);

    return pharmaciesWithDistances;
}

module.exports = {
    findPharmaciesFromDb
};
