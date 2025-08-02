// tests/integration/juliaos.test.js
const JuliaOSIntegration = require('../../src/integrations/juliaos');

describe('JuliaOS Integration (Mocked)', () => {
    let juliaos;

    beforeEach(() => {
        // Create fresh instance - it will automatically use test environment
        juliaos = new JuliaOSIntegration();
    });

    test('should create agent via API', async () => {
        const result = await juliaos.createAgent({ type: 'test' });

        expect(result).toBeDefined();
        expect(result.agentId).toMatch(/^mock_agent_\d+$/);
        expect(result.status).toBe('active');
        expect(result.config).toEqual({ type: 'test' });
    });

    test('should query blockchain data', async () => {
        const result = await juliaos.queryBlockchainData('ethereum', 'latest');

        expect(result).toBeDefined();
        expect(result.block_number).toBe(18500000);
        expect(result.gas_price).toBe('20000000000');
    });

    test('agent should use LLM API', async () => {
        const result = await juliaos.queryLLM('What are DeFi protocols?');

        expect(result).toBeDefined();
        expect(result.response).toContain('DeFi (Decentralized Finance) protocols');
        expect(result.model).toBe('julia-7b');
        expect(result.tokens_used).toBeGreaterThan(0);
    });

    test('should handle API errors gracefully', async () => {
        // Test error handling by trying to query invalid blockchain data
        const result = await juliaos.queryBlockchainData('invalid_chain', 'latest');
        
        expect(result).toBeDefined();
        expect(result.error).toBe('Mock data not available');
        expect(result.chain).toBe('invalid_chain');
    });

    test('should get agent status', async () => {
        const result = await juliaos.getAgentStatus('test_agent_123');

        expect(result).toBeDefined();
        expect(result.agentId).toBe('test_agent_123');
        expect(result.status).toBe('active');
        expect(result.version).toBe('1.0.0');
    });

    test('should perform health check', async () => {
        const result = await juliaos.healthCheck();

        expect(result).toBeDefined();
        expect(result.status).toBe('healthy');
        expect(result.services.agents).toBe('online');
    });
});