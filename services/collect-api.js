import 'dotenv/config';
import geolib from 'geolib';

async function fetchNearestPharmacies(city, district, userLocation) {
    const url =  `${process.env.COLLECT_API_URI}?ilce=${encodeURIComponent(district)}&il=${encodeURIComponent(city)}`;
    const apiKey = process.env.COLLECT_API_TOKEN;

    const headers = {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, { headers });
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`CollectAPI non-JSON response (HTTP ${response.status})`);
        }
        const data = await response.json();

        if (!data.success) {
            throw new Error(`CollectAPI request failed: ${data.message || JSON.stringify(data)}`);
        }

        const pharmacies = data.result;

        // Her eczane için merkezden uzaklık hesapla
        const pharmaciesWithDistances = pharmacies.map(pharmacy => {
            const [latitude, longitude] = pharmacy.loc.split(',');
            const pharmacyLocation = {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            };
            const distance = geolib.getDistance(userLocation, pharmacyLocation); // metre cinsinden uzaklık
            const googleMapsUrl = `${process.env.GOOGLE_MAPS_URI}&query=${pharmacy.loc}`;
            
            return { ...pharmacy, distance, googleMapsUrl };
        });

        // Uzaklığa göre sırala ve en yakın 5 eczaneyi al
        pharmaciesWithDistances.sort((a, b) => a.distance - b.distance);
        const nearestPharmacies = pharmaciesWithDistances.slice(0, 5);

        return nearestPharmacies;
    } catch (error) {
        throw error;
    }
}

export { fetchNearestPharmacies };
