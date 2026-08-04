export interface BillingEvent {
    eventId: string;        // UUIDv4 unique identifier
    tenantId: string;       // Maps directly to your Python billing engine tenants
    aggregateId: string;    // e.g., "customer_123" or "subscription_99"
    eventType: string;      // e.g., "subscription.created", "usage.recorded"
    payload: Record<string, any>; // JSON payload containing billing data
    version: number;        // Optimistic concurrency control / event versioning
    timestamp: Date;        // Exact UTC time event occurred
}