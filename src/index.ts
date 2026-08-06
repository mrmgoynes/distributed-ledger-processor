import crypto from 'crypto';
import { initializeDatabase } from './database/init.js';
import { ConsumerService } from './database/consumerService.js';
import { PublisherService } from './database/publisherService.js';

async function start() {
    console.log('🚀 Bootstrapping Microservice Orchestration Engine...');

    // 1. Prepare Infrastructure layers (PostgreSQL Schema & Immutability Rules)
    await initializeDatabase();

    // 2. Start background consumer background worker loops to listen for streaming traffic
    await ConsumerService.startListening();

    // 3. Construct a realistic streaming event payload mimicking your multi-tenant Python billing engine
    const streamingEvent = {
        eventId: crypto.randomUUID(), // Generates random UUIDv4 identifiers dynamically
        tenantId: 'tenant_enterprise_beta',
        aggregateId: 'customer_user_772',
        eventType: 'metered.usage.computed',
        payload: { cpuHours: 42.5, RAM_GB_Hours: 128 },
        version: 1,
        timestamp: new Date()
    };

    // Trigger broadcast simulation after a 2-second delay to give services breathing room to warm up
    setTimeout(async () => {
        console.log('\n--- Initiating Broadcast Simulation ---');
        await PublisherService.publishEvent(streamingEvent);
    }, 2000);
}

start();
