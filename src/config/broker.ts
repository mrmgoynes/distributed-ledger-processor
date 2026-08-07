import amqplib from 'amqplib';
import type { ChannelModel, Channel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export const BILLING_EXCHANGE = 'billing_events_exchange';
export const BILLING_QUEUE = 'tenant_billing_events';
export const RETRY_QUEUE = 'tenant_billing_events_retry';
export const BILLING_ROUTING_KEY = 'billing.main';
export const RETRY_ROUTING_KEY = 'billing.retry';

export class MessageBroker {
    private static connection: ChannelModel | null = null;
    private static channel: Channel | null = null;

    static async connect(): Promise<Channel> {
        if (this.channel) return this.channel;

        try {
            const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
            const conn = await amqplib.connect(url);
            this.connection = conn;
            this.channel = await conn.createChannel();

            // 1. Declare a central Direct Exchange to handle standard message routing
            await this.channel.assertExchange(BILLING_EXCHANGE, 'direct', { durable: true });

            // 2. Declare the main processing queue and bind it to the exchange
            await this.channel.assertQueue(BILLING_QUEUE, { durable: true });
            await this.channel.bindQueue(BILLING_QUEUE, BILLING_EXCHANGE, BILLING_ROUTING_KEY);

            // 3. Declare the stateful Retry Queue
            // When a message inside this queue expires, it automatically dead-letters back into the main exchange!
            await this.channel.assertQueue(RETRY_QUEUE, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': BILLING_EXCHANGE,
                    'x-dead-letter-routing-key': BILLING_ROUTING_KEY, // Route straight back to main processor queue
                },
            });
            await this.channel.bindQueue(RETRY_QUEUE, BILLING_EXCHANGE, RETRY_ROUTING_KEY);

            console.log('✅ Advanced Resiliency Message Broker topology established.');
            return this.channel;
        } catch (error) {
            console.error('❌ Failed to connect to RabbitMQ broker:', error);
            throw error;
        }
    }
}
