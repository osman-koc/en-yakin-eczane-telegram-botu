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


async function appendUsageDataToGoogleSheets(logData) {
    const url = `${process.env.MY_API_URI}/append-to-google-sheets`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
