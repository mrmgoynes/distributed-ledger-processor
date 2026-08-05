import amqplib from 'amqplib';
import type { ChannelModel, Channel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export const BILLING_QUEUE = 'tenant_billing_events';

export class MessageBroker {
    private static connection: ChannelModel | null = null;
    private static channel: Channel | null = null;

    static async connect(): Promise<Channel> {
        if (this.channel) return this.channel;

        try {
            const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

            // conn is inferred correctly as a ChannelModel
            const conn = await amqplib.connect(url);
            this.connection = conn;

            this.channel = await conn.createChannel();

            // Ensure the billing engine queue is durable
            await this.channel.assertQueue(BILLING_QUEUE, {
                durable: true,
            });

            console.log('✅ Connected to RabbitMQ Message Broker and asserted queues.');
            return this.channel;
        } catch (error) {
            console.error('❌ Failed to connect to RabbitMQ broker:', error);
            throw error;
        }
    }
}
