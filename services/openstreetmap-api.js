import 'dotenv/config';

async function getCityAndDistrictFromLocation(latitude, longitude) {
    const locationUrl = `${process.env.OPENSTREETMAP_URI}?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(locationUrl, {
                headers: {
                    'User-Agent': 'EnYakinHastane/1.0 (info@osmankoc.dev)'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format: Expected JSON');
            }

            const locationData = await response.json();

            if (!locationData.address) {
                console.log('-> Address is empty on Request for LocationUrl: ' + locationUrl);
                throw new Error('Konum bilgisi alınamadı.');
            }

            const country_code = locationData.address.country_code;
            if (country_code.toLowerCase() != 'tr') {
                return { country_code };
            }

            let city = locationData.address.province || locationData.address.district || locationData.address.city || locationData.address.village || '';
            let district = locationData.address.town || locationData.address.county || locationData.address.residential || '';

            if (city.includes(' ')) {
                city = city.split(' ')[0];
                if (city.split(' ').length > 1 && district === '') {
                    district = city.split(' ')[1];
                }
            }

            if (district === '' && locationData.address.city) {
                district = locationData.address.city.split(' ')[1];
            }

            if (city === '' || district === '') {
                console.log('-> City or District is empty on Request for LocationUrl: ' + locationUrl);
            }

            return { country_code, city, district };
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === maxRetries) {
                throw new Error(`Failed to fetch location data after ${maxRetries} attempts: ${error.message}`);
            }
        }
    }
}

export { getCityAndDistrictFromLocation };
