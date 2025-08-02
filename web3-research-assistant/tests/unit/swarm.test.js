const ResearchSwarm = require('../../src/swarms/ResearchSwarm');

// Mock the ResearchAgent to avoid API calls
jest.mock('../../src/agents/ResearchAgent', () => {
    return jest.fn().mockImplementation((id, config) => ({
        id,
        config: { swarmId: 'test_swarm', ...config },
        state: { isActive: false, currentTask: null, researchHistory: [] },
        
        initialize: jest.fn().mockResolvedValue(true),
        
        researchProject: jest.fn().mockImplementation(async (projectName, criteria) => {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return {
                success: true,
                data: {
                    analysis: `Mock analysis for ${projectName}`,
                    confidence: 0.85,
                    recommendations: [`Recommendation for ${projectName}`],
                    criteria_addressed: criteria
                },
                timestamp: new Date().toISOString()
            };
        }),
        
        getState: jest.fn().mockReturnValue({
            isActive: true,
            currentTask: null,
            researchHistory: []
        }),
        
        getHistory: jest.fn().mockReturnValue([])
    }));
});

describe('ResearchSwarm', () => {
    let swarm;

    beforeEach(async () => {
        jest.clearAllMocks();
        swarm = new ResearchSwarm('test_swarm', { maxAgents: 3 });
        await swarm.initialize();
    });

    test('should initialize correctly', () => {
        expect(swarm.swarmId).toBe('test_swarm');
        expect(swarm.isActive).toBe(true);
        expect(swarm.agents.size).toBe(3);
    });

    test('should coordinate research across multiple projects', async () => {
        const projects = ['Project Alpha', 'Project Beta', 'Project Gamma'];
        const criteria = ['tokenomics', 'team'];
        
        const result = await swarm.coordinateResearch(projects, criteria);
        
        expect(result.swarmId).toBe('test_swarm');
        expect(result.totalProjects).toBe(3);
        expect(result.results).toHaveLength(3);
        
        result.results.forEach((projectResult, index) => {
            expect(projectResult.project).toBe(projects[index]);
            expect(projectResult.result.success).toBe(true);
            expect(projectResult.result.data).toHaveProperty('analysis');
        });
    });

    test('should distribute work evenly among agents', async () => {
        const projects = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
        const result = await swarm.coordinateResearch(projects, ['test']);
        
        // With 3 agents and 6 projects, each agent should handle 2 projects
        const agentWorkload = {};
        result.results.forEach(res => {
            agentWorkload[res.agent] = (agentWorkload[res.agent] || 0) + 1;
        });
        
        Object.values(agentWorkload).forEach(workload => {
            expect(workload).toBe(2);
        });
    });

    test('should return swarm status correctly', () => {
        const status = swarm.getSwarmStatus();
        
        expect(status.swarmId).toBe('test_swarm');
        expect(status.isActive).toBe(true);
        expect(status.agentCount).toBe(3);
        expect(status.queueSize).toBe(0);
        expect(status.agents).toHaveProperty('agent_0');
        expect(status.agents).toHaveProperty('agent_1');
        expect(status.agents).toHaveProperty('agent_2');
    });

    test('should add new agents dynamically', async () => {
        const initialCount = swarm.agents.size;
        const newAgentId = await swarm.addAgent({ specialization: 'defi' });
        
        expect(swarm.agents.size).toBe(initialCount + 1);
        expect(newAgentId).toMatch(/agent_/);
        expect(swarm.agents.has(newAgentId)).toBe(true);
    });

    test('should remove agents correctly', async () => {
        const agentToRemove = 'agent_0';
        const initialCount = swarm.agents.size;
        
        const removed = await swarm.removeAgent(agentToRemove);
        
        expect(removed).toBe(true);
        expect(swarm.agents.size).toBe(initialCount - 1);
        expect(swarm.agents.has(agentToRemove)).toBe(false);
    });

    test('should handle research failures gracefully', async () => {
        // Mock one agent to fail
        const failingAgent = Array.from(swarm.agents.values())[0];
        failingAgent.researchProject.mockRejectedValueOnce(new Error('Agent malfunction'));
        
        const result = await swarm.coordinateResearch(['Test Project'], ['test']);
        
        expect(result.results).toHaveLength(1);
        expect(result.results[0].result.success).toBe(false);
        expect(result.results[0].result.error).toContain('Agent malfunction');
    });
});