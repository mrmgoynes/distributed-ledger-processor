import { initializeDatabase } from './database/init.js';
import { LedgerService } from './database/ledgerService.js';

async function start() {
    console.log('🚀 Starting Distributed Ledger Engine...');

    // Provision table and rules
    await initializeDatabase();

    // Construct a mock billing event matching our multi-tenant requirements
    const mockEvent = {
        eventId: 'a63b0185-3b1a-4712-9860-91118671603a',
        tenantId: 'tenant_enterprise_alpha',
        aggregateId: 'sub_invoice_991',
        eventType: 'invoice.generated',
        payload: { amount: 1500.00, currency: 'USD', itemsCount: 4 },
        version: 1,
        timestamp: new Date()
    };

    try {
        await LedgerService.append(mockEvent);
        console.log('✏️ Successfully appended mock test event to immutable ledger.');

        const events = await LedgerService.getByTenant('tenant_enterprise_alpha');
        console.log(`📋 Verification: Retrieved ${events.length} event(s) for tenant.`);
    } catch (err) {
        console.log('ℹ️ Database append test finished (Entry may already exist).');
    }
}

start();
