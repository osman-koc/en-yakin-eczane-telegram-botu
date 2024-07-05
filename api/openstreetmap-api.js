import 'dotenv/config';

async function getCityAndDistrictFromLocation(latitude, longitude) {
    const locationUrl = `${process.env.OPENSTREETMAP_URI}?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const response = await fetch(locationUrl);
    const locationData = await response.json();

    if (!locationData.address) {
        console.log('-> Request for LocationUrl: ' + locationUrl);
        throw new Error('Konum bilgisi alınamadı.');
    }

    let city = locationData.address.province || locationData.address.district || locationData.address.city || locationData.address.village || '';
    let district = locationData.address.town || locationData.address.county || locationData.address.residential || '';

    if (city.includes(' ')) {
        city = city.split(' ')[0];
        if (city.split(' ').length > 1 && district === '') {
            district = city.split(' ')[1];
        }
    }

    if (district === '' && locationData.address.city){
        district = locationData.address.city.split(' ')[1];
    }

    if (city === '' || district === '') {
        console.log('-> Request for LocationUrl: ' + locationUrl);
    }

    return { city, district };
}

export { getCityAndDistrictFromLocation };
