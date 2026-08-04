import { pool } from '../config/db.js';

export async function initializeDatabase() {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS event_ledger (
      event_id UUID PRIMARY KEY,
      tenant_id VARCHAR(100) NOT NULL,
      aggregate_id VARCHAR(100) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      version INT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ledger_tenant ON event_ledger(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_aggregate ON event_ledger(aggregate_id);
  `;

    const createImmutabilityRule = `
    CREATE OR REPLACE RULE protect_ledger_updates AS 
    ON UPDATE TO event_ledger DO INSTEAD NOTHING;

    CREATE OR REPLACE RULE protect_ledger_deletes AS 
    ON DELETE TO event_ledger DO INSTEAD NOTHING;
  `;

    try {
        await pool.query(createTableQuery);
        await pool.query(createImmutabilityRule);
        console.log('✅ PostgreSQL Event Ledger initialized successfully.');
    } catch (error) {
        console.error('❌ Failed to initialize ledger database:', error);
        process.exit(1);
    }
}