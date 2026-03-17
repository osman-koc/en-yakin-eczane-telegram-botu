import 'dotenv/config';

const MY_API_TIMEOUT_MS = 8000;

async function fetchPharmacies(city, district) {
    const url = `${process.env.MY_API_URI}/pharmacies?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MY_API_TIMEOUT_MS);

    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (process.env.MY_API_KEY) {
            headers['x-api-key'] = process.env.MY_API_KEY;
        }
        const response = await fetch(url, { headers, signal: controller.signal });
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`API non-JSON response (HTTP ${response.status})`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('API request failed or no pharmacies found');
        }
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`MyAPI timeout after ${MY_API_TIMEOUT_MS}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
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
        throw error;
    }
}

export { fetchPharmacies, appendUsageDataToGoogleSheets };
