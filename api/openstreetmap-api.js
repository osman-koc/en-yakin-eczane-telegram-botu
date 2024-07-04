import 'dotenv/config';

async function getCityAndDistrictFromLocation(latitude, longitude) {
    const locationUrl = `${process.env.OPENSTREETMAP_URI}?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

    const response = await fetch(locationUrl);
    const locationData = await response.json();

    if (!locationData.address) {
        throw new Error('Konum bilgisi alınamadı.');
    }

    const city = locationData.address.district || locationData.address.city || locationData.address.village || '';
    const district = locationData.address.town || locationData.address.county || locationData.address.residential || '';

    return { city, district };
}

export { getCityAndDistrictFromLocation };
