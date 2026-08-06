import { MessageBroker, BILLING_QUEUE } from '../config/broker.js';
import { LedgerService } from './ledgerService.js';
import { BillingEvent } from '../types/event.js';

export class ConsumerService {
    static async startListening(): Promise<void> {
        try {
            const channel = await MessageBroker.connect();

            // Fair dispatch: don't give more than 1 message to a worker until acknowledged
            await channel.prefetch(1);

            console.log('📥 Worker consumer listening for streaming ledger events...');

            channel.consume(BILLING_QUEUE, async (msg) => {
                if (!msg) return;

                try {
                    // Decode the raw binary buffer back into a structured TypeScript object
                    const event: BillingEvent = JSON.parse(msg.content.toString());
                    console.log(`⚡ Worker processing streaming event [${event.eventId}] for tenant: ${event.tenantId}`);

                    // Append streaming transaction straight to PostgreSQL ledger storage
                    await LedgerService.append(event);

                    // Explicitly acknowledge processing success to pull message off the broker queue
                    channel.ack(msg);
                    console.log(`✅ Event [${event.eventId}] successfully saved and acknowledged.`);
                } catch (processingError) {
                    console.error('❌ Consumer processing block failure:', processingError);
                    // Negative acknowledge: do not drop, requeue for retry execution later
                    channel.nack(msg, false, true);
                }
            });
        } catch (error) {
            console.error('❌ Failed to establish consumer worker loops:', error);
        }
    }
}
