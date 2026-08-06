import { MessageBroker, BILLING_QUEUE } from '../config/broker.js';
import { BillingEvent } from '../types/event.js';

export class PublisherService {
    static async publishEvent(event: BillingEvent): Promise<boolean> {
        try {
            const channel = await MessageBroker.connect();
            const messageBuffer = Buffer.from(JSON.stringify(event));

            // Publish with the persistent flag so messages survive unexpected broker crashes
            const published = channel.sendToQueue(BILLING_QUEUE, messageBuffer, {
                persistent: true,
            });

            if (published) {
                console.log(`📤 Event [${event.eventId}] successfully published to broker queue.`);
            }
            return published;
        } catch (error) {
            console.error(`❌ Failed to publish event [${event.eventId}]:`, error);
            return false;
        }
    }
}
