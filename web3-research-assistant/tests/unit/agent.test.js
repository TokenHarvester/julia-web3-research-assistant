const ResearchAgent = require('../../src/agents/ResearchAgent');

// Mock the JuliaOS integration to avoid network calls
jest.mock('../../src/integrations/juliaos', () => ({
    createAgent: jest.fn().mockResolvedValue({
        agentId: 'test_agent_123',
        status: 'active'
    }),
    queryBlockchain: jest.fn().mockResolvedValue({
        address: 'So11111111111111111111111111111111111111112',
        decimals: 9,
        name: 'Wrapped SOL'
    }),
    useLLM: jest.fn().mockResolvedValue({
        content: 'Mock LLM response about the project',
        tokens_used: 150,
        model: 'gpt-4'
    })
}));

describe('ResearchAgent', () => {
    let agent;

    beforeEach(async () => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        agent = new ResearchAgent('test_agent');
        await agent.initialize();
    });

    test('should initialize correctly', () => {
        expect(agent.id).toBe('test_agent');
        expect(agent.state.isActive).toBe(true);
        expect(agent.state.researchHistory).toEqual([]);
    });

    test('should research a project', async () => {
        const result = await agent.researchProject('Example Project', ['tokenomics', 'team']);
        
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('analysis');
        expect(result.data).toHaveProperty('recommendations');
        expect(result.data).toHaveProperty('confidence');
        expect(result.data.confidence).toBeGreaterThan(0);
        expect(result.data.recommendations).toBeInstanceOf(Array);
    });

    test('should maintain research history', async () => {
        await agent.researchProject('Project A', ['security']);
        await agent.researchProject('Project B', ['community']);
        
        const history = agent.getHistory();
        expect(history).toHaveLength(2);
        expect(history[0].project).toBe('Project A');
        expect(history[1].project).toBe('Project B');
        expect(history[0].result).toHaveProperty('analysis');
        expect(history[1].result).toHaveProperty('analysis');
    });

    test('should handle research errors gracefully', async () => {
        // Mock a failure in the LLM call
        const mockAgent = new ResearchAgent('error_agent');
        mockAgent.callJuliaOSLLM = jest.fn().mockRejectedValue(new Error('Network error'));
        
        await mockAgent.initialize();
        const result = await mockAgent.researchProject('Failed Project', ['tokenomics']);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
    });

    test('should track current task state', async () => {
        const researchPromise = agent.researchProject('Async Project', ['team']);
        
        // Check that current task is set during research
        expect(agent.state.currentTask).toBeTruthy();
        expect(agent.state.currentTask.type).toBe('project_research');
        expect(agent.state.currentTask.target).toBe('Async Project');
        
        await researchPromise;
        
        // Check that current task is cleared after completion
        expect(agent.state.currentTask).toBeNull();
    });

    test('should include agent configuration in state', () => {
        const configuredAgent = new ResearchAgent('configured_agent', {
            maxTokens: 2000,
            temperature: 0.5
        });
        
        expect(configuredAgent.config.maxTokens).toBe(2000);
        expect(configuredAgent.config.temperature).toBe(0.5);
    });
});