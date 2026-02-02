/**
 * =====================================================
 * PATTERN 4: BIDDING LOAD TEST
 * =====================================================
 * Comprehensive load testing for competitive bidding system
 * Simulates multiple concurrent bidding sessions
 *
 * Run with: deno run --allow-all biddingLoadTest.ts
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// CONFIGURATION
// =====================================================

interface LoadTestConfig {
    // Supabase connection
    supabaseUrl: string;
    supabaseKey: string;

    // Test parameters
    concurrentSessions: number; // Number of simultaneous bidding sessions
    bidsPerSession: number; // Number of bids per session
    bidDelayMs: number; // Delay between bids (milliseconds)
    sessionDurationSeconds: number; // How long each session runs

    // User simulation
    totalUsers: number; // Total users to simulate
    autoBidProbability: number; // Probability user sets auto-bid (0-1)
}

const DEFAULT_CONFIG: LoadTestConfig = {
    supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
    supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    concurrentSessions: 10,
    bidsPerSession: 20,
    bidDelayMs: 500,
    sessionDurationSeconds: 300, // 5 minutes
    totalUsers: 20,
    autoBidProbability: 0.5,
};

// =====================================================
// LOAD TEST RUNNER
// =====================================================

class BiddingLoadTestRunner {
    private supabase: SupabaseClient;
    private config: LoadTestConfig;
    private startTime: number = 0;
    private metrics: LoadTestMetrics = {
        sessionsCreated: 0,
        bidsPlaced: 0,
        autoBidsTriggered: 0,
        sessionsCompleted: 0,
        errors: [],
        latencies: [],
    };

    constructor(config: LoadTestConfig) {
        this.config = config;
        this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }

    /**
     * Run full load test
     */
    async run(): Promise<LoadTestResults> {
        console.log('========================================');
        console.log('BIDDING SYSTEM LOAD TEST');
        console.log('========================================\n');
        console.log('Configuration:');
        console.log(`  Concurrent Sessions: ${this.config.concurrentSessions}`);
        console.log(`  Bids Per Session: ${this.config.bidsPerSession}`);
        console.log(`  Total Users: ${this.config.totalUsers}`);
        console.log(`  Bid Delay: ${this.config.bidDelayMs}ms`);
        console.log(`  Auto-Bid Probability: ${(this.config.autoBidProbability * 100).toFixed(0)}%`);
        console.log('\n========================================\n');

        this.startTime = Date.now();

        try {
            // Phase 1: Create test users
            console.log('[Phase 1] Creating test users...');
            const users = await this.createTestUsers();
            console.log(`✓ Created ${users.length} test users\n`);

            // Phase 2: Create bidding sessions
            console.log('[Phase 2] Creating bidding sessions...');
            const sessions = await this.createBiddingSessions(users);
            console.log(`✓ Created ${sessions.length} bidding sessions\n`);

            // Phase 3: Simulate concurrent bidding
            console.log('[Phase 3] Simulating concurrent bidding...');
            await this.simulateConcurrentBidding(sessions, users);
            console.log(`✓ Completed bidding simulation\n`);

            // Phase 4: Verify results
            console.log('[Phase 4] Verifying results...');
            const verificationResults = await this.verifyResults(sessions);
            console.log(`✓ Verification complete\n`);

            // Phase 5: Cleanup
            console.log('[Phase 5] Cleaning up test data...');
            await this.cleanup(sessions, users);
            console.log(`✓ Cleanup complete\n`);

            // Generate results
            const results = this.generateResults(verificationResults);
            this.printResults(results);

            return results;
        } catch (error) {
            console.error('\n❌ Load test failed:', error);
            throw error;
        }
    }

    /**
     * Create test users
     */
    private async createTestUsers(): Promise<TestUser[]> {
        const users: TestUser[] = [];

        for (let i = 0; i < this.config.totalUsers; i++) {
            const userId = `load_test_user_${Date.now()}_${i}`;
            users.push({
                userId,
                userName: `LoadTestUser${i}`,
                archetype: 'big_spender',
            });
        }

        return users;
    }

    /**
     * Create bidding sessions (pair up users)
     */
    private async createBiddingSessions(users: TestUser[]): Promise<TestSession[]> {
        const sessions: TestSession[] = [];

        for (let i = 0; i < this.config.concurrentSessions; i++) {
            const user1 = users[i * 2];
            const user2 = users[i * 2 + 1];

            if (!user1 || !user2) break;

            const sessionId = `load_test_session_${Date.now()}_${i}`;
            const targetNight = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

            // Create session via API
            try {
                const startTime = Date.now();

                const { data, error } = await this.supabase
                    .from('bidding_sessions')
                    .insert({
                        session_id: sessionId,
                        target_night: targetNight.toISOString().split('T')[0],
                        property_id: `load_test_property_${i}`,
                        status: 'active',
                        started_at: new Date().toISOString(),
                        expires_at: new Date(Date.now() + this.config.sessionDurationSeconds * 1000).toISOString(),
                        max_rounds: 10,
                        round_duration_seconds: this.config.sessionDurationSeconds,
                        minimum_increment_percent: 10.0,
                        current_round: 1,
                        winning_bid_amount: 2000 + i * 100, // Starting bid
                    })
                    .select()
                    .single();

                if (error) throw error;

                const latency = Date.now() - startTime;
                this.metrics.latencies.push(latency);

                // Create participants
                await this.supabase.from('bidding_participants').insert([
                    {
                        session_id: sessionId,
                        user_id: user1.userId,
                        user_name: user1.userName,
                        user_archetype: 'big_spender',
                    },
                    {
                        session_id: sessionId,
                        user_id: user2.userId,
                        user_name: user2.userName,
                        user_archetype: 'big_spender',
                    },
                ]);

                sessions.push({
                    sessionId,
                    participants: [user1, user2],
                    startingBid: 2000 + i * 100,
                });

                this.metrics.sessionsCreated++;
            } catch (error) {
                this.metrics.errors.push(`Session creation failed: ${error.message}`);
            }
        }

        return sessions;
    }

    /**
     * Simulate concurrent bidding across all sessions
     */
    private async simulateConcurrentBidding(
        sessions: TestSession[],
        users: TestUser[]
    ): Promise<void> {
        const promises = sessions.map((session) =>
            this.simulateSessionBidding(session)
        );

        await Promise.all(promises);
    }

    /**
     * Simulate bidding in a single session
     */
    private async simulateSessionBidding(session: TestSession): Promise<void> {
        const [user1, user2] = session.participants;
        let currentBid = session.startingBid;

        for (let round = 0; round < this.config.bidsPerSession; round++) {
            // Alternate between users
            const bidder = round % 2 === 0 ? user1 : user2;

            // Calculate next bid (10% increment)
            const nextBid = Math.round(currentBid * 1.1);

            try {
                const startTime = Date.now();

                // Place bid
                const { data, error } = await this.supabase
                    .from('bids')
                    .insert({
                        session_id: session.sessionId,
                        user_id: bidder.userId,
                        amount: nextBid,
                        round_number: Math.floor(round / 2) + 1,
                        is_auto_bid: false,
                        previous_high_bid: currentBid,
                        increment_amount: nextBid - currentBid,
                        increment_percent: 10.0,
                        was_valid: true,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update session
                await this.supabase
                    .from('bidding_sessions')
                    .update({
                        winner_user_id: bidder.userId,
                        winning_bid_amount: nextBid,
                        current_round: Math.floor(round / 2) + 1,
                    })
                    .eq('session_id', session.sessionId);

                const latency = Date.now() - startTime;
                this.metrics.latencies.push(latency);
                this.metrics.bidsPlaced++;

                currentBid = nextBid;

                // Delay before next bid
                await new Promise((resolve) => setTimeout(resolve, this.config.bidDelayMs));
            } catch (error) {
                this.metrics.errors.push(`Bid placement failed: ${error.message}`);
            }
        }

        // Mark session as completed
        try {
            await this.supabase
                .from('bidding_sessions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('session_id', session.sessionId);

            this.metrics.sessionsCompleted++;
        } catch (error) {
            this.metrics.errors.push(`Session completion failed: ${error.message}`);
        }
    }

    /**
     * Verify test results
     */
    private async verifyResults(sessions: TestSession[]): Promise<VerificationResults> {
        const results: VerificationResults = {
            totalSessions: sessions.length,
            completedSessions: 0,
            totalBids: 0,
            averageBidsPerSession: 0,
            sessionsWithErrors: 0,
        };

        for (const session of sessions) {
            try {
                // Check session status
                const { data: sessionData } = await this.supabase
                    .from('bidding_sessions')
                    .select('*')
                    .eq('session_id', session.sessionId)
                    .single();

                if (sessionData?.status === 'completed') {
                    results.completedSessions++;
                }

                // Count bids
                const { data: bids, error } = await this.supabase
                    .from('bids')
                    .select('*')
                    .eq('session_id', session.sessionId);

                if (bids) {
                    results.totalBids += bids.length;
                }
            } catch (error) {
                results.sessionsWithErrors++;
            }
        }

        results.averageBidsPerSession = results.totalBids / results.totalSessions;

        return results;
    }

    /**
     * Cleanup test data
     */
    private async cleanup(sessions: TestSession[], users: TestUser[]): Promise<void> {
        // Delete bids
        for (const session of sessions) {
            await this.supabase
                .from('bids')
                .delete()
                .eq('session_id', session.sessionId);
        }

        // Delete participants
        for (const session of sessions) {
            await this.supabase
                .from('bidding_participants')
                .delete()
                .eq('session_id', session.sessionId);
        }

        // Delete sessions
        for (const session of sessions) {
            await this.supabase
                .from('bidding_sessions')
                .delete()
                .eq('session_id', session.sessionId);
        }
    }

    /**
     * Generate final results
     */
    private generateResults(verification: VerificationResults): LoadTestResults {
        const duration = (Date.now() - this.startTime) / 1000;
        const avgLatency = this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length;
        const p95Latency = this.calculatePercentile(this.metrics.latencies, 95);
        const p99Latency = this.calculatePercentile(this.metrics.latencies, 99);

        return {
            duration,
            metrics: this.metrics,
            verification,
            performance: {
                avgLatencyMs: Math.round(avgLatency),
                p95LatencyMs: Math.round(p95Latency),
                p99LatencyMs: Math.round(p99Latency),
                requestsPerSecond: this.metrics.bidsPlaced / duration,
                successRate: (this.metrics.bidsPlaced / (this.metrics.bidsPlaced + this.metrics.errors.length)) * 100,
            },
        };
    }

    /**
     * Calculate percentile
     */
    private calculatePercentile(values: number[], percentile: number): number {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    /**
     * Print results
     */
    private printResults(results: LoadTestResults): void {
        console.log('\n========================================');
        console.log('LOAD TEST RESULTS');
        console.log('========================================\n');

        console.log('Duration:', results.duration.toFixed(2), 'seconds');
        console.log('\nMetrics:');
        console.log('  Sessions Created:', results.metrics.sessionsCreated);
        console.log('  Bids Placed:', results.metrics.bidsPlaced);
        console.log('  Sessions Completed:', results.metrics.sessionsCompleted);
        console.log('  Errors:', results.metrics.errors.length);

        console.log('\nPerformance:');
        console.log('  Avg Latency:', results.performance.avgLatencyMs, 'ms');
        console.log('  P95 Latency:', results.performance.p95LatencyMs, 'ms');
        console.log('  P99 Latency:', results.performance.p99LatencyMs, 'ms');
        console.log('  Requests/sec:', results.performance.requestsPerSecond.toFixed(2));
        console.log('  Success Rate:', results.performance.successRate.toFixed(2), '%');

        console.log('\nVerification:');
        console.log('  Total Sessions:', results.verification.totalSessions);
        console.log('  Completed:', results.verification.completedSessions);
        console.log('  Total Bids:', results.verification.totalBids);
        console.log('  Avg Bids/Session:', results.verification.averageBidsPerSession.toFixed(1));
        console.log('  Sessions w/ Errors:', results.verification.sessionsWithErrors);

        if (results.metrics.errors.length > 0) {
            console.log('\nErrors:');
            results.metrics.errors.slice(0, 10).forEach((error) => {
                console.log('  -', error);
            });
            if (results.metrics.errors.length > 10) {
                console.log(`  ... and ${results.metrics.errors.length - 10} more`);
            }
        }

        console.log('\n========================================\n');
    }
}

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface TestUser {
    userId: string;
    userName: string;
    archetype: string;
}

interface TestSession {
    sessionId: string;
    participants: [TestUser, TestUser];
    startingBid: number;
}

interface LoadTestMetrics {
    sessionsCreated: number;
    bidsPlaced: number;
    autoBidsTriggered: number;
    sessionsCompleted: number;
    errors: string[];
    latencies: number[];
}

interface VerificationResults {
    totalSessions: number;
    completedSessions: number;
    totalBids: number;
    averageBidsPerSession: number;
    sessionsWithErrors: number;
}

interface LoadTestResults {
    duration: number;
    metrics: LoadTestMetrics;
    verification: VerificationResults;
    performance: {
        avgLatencyMs: number;
        p95LatencyMs: number;
        p99LatencyMs: number;
        requestsPerSecond: number;
        successRate: number;
    };
}

// =====================================================
// MAIN EXECUTION
// =====================================================

if (import.meta.main) {
    const config = DEFAULT_CONFIG;

    // Allow overrides via command line args
    const args = Deno.args;
    if (args.includes('--sessions')) {
        const index = args.indexOf('--sessions');
        config.concurrentSessions = parseInt(args[index + 1]);
    }
    if (args.includes('--bids')) {
        const index = args.indexOf('--bids');
        config.bidsPerSession = parseInt(args[index + 1]);
    }

    const runner = new BiddingLoadTestRunner(config);

    try {
        await runner.run();
        Deno.exit(0);
    } catch (error) {
        console.error('Load test failed:', error);
        Deno.exit(1);
    }
}

// =====================================================
// EXPORT
// =====================================================

export { BiddingLoadTestRunner, DEFAULT_CONFIG };
export type { LoadTestConfig, LoadTestResults };
