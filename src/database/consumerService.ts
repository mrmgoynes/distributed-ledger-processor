import { MessageBroker, BILLING_EXCHANGE, RETRY_ROUTING_KEY } from '../config/broker.js';
import { LedgerService } from './ledgerService.js';
import { BackoffUtil } from '../config/backoff.js';
import { BillingEvent } from '../types/event.js';

export class ConsumerService {
    static async startListening(): Promise<void> {
        try {
            const channel = await MessageBroker.connect();
            await channel.prefetch(1);

            console.log('📥 Worker consumer listening for streaming ledger events...');

            channel.consume('tenant_billing_events', async (msg) => {
                if (!msg) return;

                let event: BillingEvent | null = null;

                try {
                    event = JSON.parse(msg.content.toString());
                    console.log(`⚡ Worker processing streaming event [${event?.eventId}] for tenant: ${event?.tenantId}`);

                    // --- ARTIFICIAL SIMULATION TRIGGER ---
                    // If the event payload contains a "simulateError" flag, force a throw to test resilience!
                    if (event?.payload && event.payload.simulateError === true) {
                        throw new Error('Database connection timed out (Simulated Transient Failure).');
                    }

                    // Append streaming transaction straight to PostgreSQL ledger storage
                    if (event) {
                        await LedgerService.append(event);
                        channel.ack(msg);
                        console.log(`✅ Event [${event.eventId}] successfully saved and acknowledged.`);
                    }
                } catch (processingError: any) {
                    console.error(`❌ Consumer failure detected on event processing loop.`);

                    if (event) {
                        // Initialize metadata tracking parameters if they don't exist yet
                        const currentRetryCount = event.metadata?.retryCount ?? 0;
                        const nextRetryCount = currentRetryCount + 1;

                        // Calculate exponential backoff delaying millisecond threshold
                        const delayMs = BackoffUtil.calculateDelay(nextRetryCount);

                        // Structure updated metadata packet payload
                        event.metadata = {
                            retryCount: nextRetryCount,
                            lastError: processingError.message || String(processingError)
                        };

                        console.warn(`⚠️ Routing event [${event.eventId}] to backoff delay queue for ${delayMs}ms (Attempt #${nextRetryCount})`);

                        const messageBuffer = Buffer.from(JSON.stringify(event));

                        // Publish message to retry queue with an expiration property (TTL) matching our math
                        channel.publish(BILLING_EXCHANGE, RETRY_ROUTING_KEY, messageBuffer, {
                            persistent: true,
                            expiration: delayMs.toString()
                        });

                        // Acknowledge original message to pull it out of main queue (it is now safely inside the retry queue)
                        channel.ack(msg);
                    } else {
                        // Completely malformed JSON payloads cannot be read at all; drop immediately to prevent loop locks
                        console.error('💥 Poison Pill Payload completely unreadable. Dropping message.');
                        channel.nack(msg, false, false);
                    }
                }
            });
        } catch (error) {
            console.error('❌ Failed to establish consumer worker loops:', error);
        }
    }
}
