import { db } from '@/modules/firebase/config';

export interface CleanupResult {
    success: boolean;
    deletedTickets: number;
    cutoffDate: string;
    message: string;
    error?: string;
}

class CleanupService {
    private baseUrl: string;

    constructor() {
        // Use the Firebase Functions URL for your project
        this.baseUrl = 'https://us-central1-your-project-id.cloudfunctions.net';
    }

    async cleanupExpiredTickets(daysOld: number = 1): Promise<CleanupResult> {
        try {
            const response = await fetch(`${this.baseUrl}/cleanupExpiredTickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ daysOld }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error cleaning up expired tickets:', error);
            return {
                success: false,
                deletedTickets: 0,
                cutoffDate: '',
                message: 'Failed to cleanup expired tickets',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async getExpiredTicketsCount(daysOld: number = 1): Promise<number> {
        try {
            const now = new Date();
            const cutoffDate = new Date(now);
            cutoffDate.setDate(now.getDate() - daysOld);
            cutoffDate.setHours(23, 59, 59, 999);

            const ticketsQuery = await db
                .collection('tickets')
                .where('eventDate', '<', cutoffDate)
                .where('status', 'in', ['unscanned', 'scanned'])
                .get();

            return ticketsQuery.size;
        } catch (error) {
            console.error('Error getting expired tickets count:', error);
            return 0;
        }
    }
}

export const cleanupService = new CleanupService();
