import 'dotenv/config';

async function fetchPharmacies(city, district) {
    const url = `${process.env.MY_API_URI}/pharmacies?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`;

    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (process.env.MY_API_KEY) {
            headers['x-api-key'] = process.env.MY_API_KEY;
        }
        const response = await fetch(url, {
            headers
        });
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('API non-JSON response:', text);
            throw new Error('API non-JSON response');
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            console.log('API response (empty or not array):', data);
            throw new Error('API request failed or no pharmacies found');
        }
        return data;
    } catch (error) {
        console.error('Error fetching pharmacies:', error);
        throw error;
    }
}


async function appendUsageDataToGoogleSheets(logData) {
    const url = `${process.env.MY_API_URI}/append-to-google-sheets`;

    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (process.env.MY_API_KEY) {
            headers['x-api-key'] = process.env.MY_API_KEY;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ logData })
        });

        if (!response.ok) {
            throw new Error('Failed to append data to Google Sheets');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error appending pharmacies to Google Sheets:', error);
        throw error;
    }
}

export { fetchPharmacies, appendUsageDataToGoogleSheets };
