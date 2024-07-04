import 'dotenv/config';

async function fetchPharmacies(city, district) {
    const url = `${process.env.MY_API_URI}/pharmacies/${encodeURIComponent(city)}/${encodeURIComponent(district)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('API request failed or no pharmacies found');
        }

        return data;
    } catch (error) {
        console.error('Error fetching pharmacies:', error);
        throw error;
    }
}

export { fetchPharmacies };
