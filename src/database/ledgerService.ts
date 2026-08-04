import { pool } from '../config/db.js';
import { BillingEvent } from '../types/event.js';

export class LedgerService {
    static async append(event: BillingEvent): Promise<void> {
        const query = `
      INSERT INTO event_ledger (event_id, tenant_id, aggregate_id, event_type, payload, version, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;

        const values = [
            event.eventId,
            event.tenantId,
            event.aggregateId,
            event.eventType,
            JSON.stringify(event.payload),
            event.version,
            event.timestamp
        ];

        await pool.query(query, values);
    }

    static async getByTenant(tenantId: string): Promise<BillingEvent[]> {
        const query = `SELECT * FROM event_ledger WHERE tenant_id = $1 ORDER BY timestamp ASC;`;
        const res = await pool.query(query, [tenantId]);

        return res.rows.map(row => ({
            eventId: row.event_id,
            tenantId: row.tenant_id,
            aggregateId: row.aggregate_id,
            eventType: row.event_type,
            payload: row.payload,
            version: row.version,
            timestamp: row.timestamp
        }));
    }
}
