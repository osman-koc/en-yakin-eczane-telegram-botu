import 'dotenv/config';
import { google } from 'googleapis';

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const sheetRange = process.env.GOOGLE_SHEET_RANGE;
const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);

async function appendData(data) {
    try {
        const client = await google.auth.getClient({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth: client });

        const request = {
            spreadsheetId: spreadsheetId,
            range: sheetRange,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [data],
            },
        };

        const response = await sheets.spreadsheets.values.append(request);
        return response.data;
    } catch (err) {
        console.error('The GoogleSheet API returned an error:', err);
    }
}

export { appendData };
