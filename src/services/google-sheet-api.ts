import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { sheets_v4 } from 'googleapis';
import env from '../config/environment';

export class GoogleSheetAPI {
    private auth: GoogleAuth | null = null;
    private credentialsError: string | null = null;

    constructor(authConfigPath: string) {
        try {
            this.validateAndInitializeCredentials(authConfigPath);
        } catch (error) {
            this.credentialsError = error instanceof Error ? error.message : 'Unknown error';
        }
    }

    private validateAndInitializeCredentials(authConfigPath: string): void {
        try {
            // Check if key file exists
            const fs = require('fs');
            if (!fs.existsSync(authConfigPath)) {
                throw new Error(`Service account file not found: ${authConfigPath}`);
            }

            // Try to parse the JSON file
            const keyFileContent = fs.readFileSync(authConfigPath, 'utf8');
            const credentials = JSON.parse(keyFileContent);

            // Validate required fields
            if (!credentials.private_key || !credentials.client_email || !credentials.project_id) {
                throw new Error('Invalid service account file: missing required fields (private_key, client_email, project_id)');
            }

            this.auth = new google.auth.GoogleAuth({
                keyFile: authConfigPath,
                scopes: [env.GOOGLE_SHEET_SCOPES],
            });
        } catch (error) {
            this.credentialsError = error instanceof Error ? error.message : 'Unknown error';
            throw error;
        }
    }

    isAvailable(): boolean {
        return this.auth !== null && this.credentialsError === null;
    }

    getCredentialsError(): string | null {
        return this.credentialsError;
    }

    private ensureCredentialsValid(): void {
        if (!this.isAvailable()) {
            throw new Error(`Google Sheets not available: ${this.credentialsError || 'Unknown error'}`);
        }
    }

    async writeToSheet(
        spreadsheetId: string,
        range: string,
        values: (string | number)[][]
    ): Promise<sheets_v4.Schema$UpdateValuesResponse> {
        this.ensureCredentialsValid();
        const sheets = google.sheets({ version: 'v4', auth: this.auth! });
        const valueInputOption = 'USER_ENTERED';

        try {
            const response = await sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption,
                requestBody: { values }
            });
            return response.data;
        } catch (error) {
            console.error('Error writing to sheet:', error);
            throw error;
        }
    }

    async readFromSheet(
        spreadsheetId: string, 
        range: string
    ): Promise<string[][]> {
        this.ensureCredentialsValid();
        const sheets = google.sheets({ version: 'v4', auth: this.auth! });

        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
            return response.data.values ?? [];
        } catch (error) {
            console.error('Error reading from sheet:', error);
            throw error;
        }
    }

    async readFromSheetWithMetadata(
        spreadsheetId: string, 
        range: string
    ): Promise<sheets_v4.Schema$ValueRange> {
        this.ensureCredentialsValid();
        const sheets = google.sheets({ version: 'v4', auth: this.auth! });

        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
            return response.data;
        } catch (error) {
            console.error('Error reading from sheet with metadata:', error);
            throw error;
        }
    }
}
