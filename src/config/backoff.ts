export class BackoffUtil {
    private static BASE_DELAY_MS = 1000; // Start with a 1-second base

    static calculateDelay(retryCount: number): number {
        // Formula: 2^retryCount * 1000ms
        // Attempt 1 = 2000ms, Attempt 2 = 4000ms, Attempt 3 = 8000ms
        return Math.pow(2, retryCount) * this.BASE_DELAY_MS;
    }
}
