const ResearchAgent = require('../agents/ResearchAgent');

class ResearchSwarm {
    constructor(swarmId, config = {}) {
        this.swarmId = swarmId;
        this.config = {
            maxAgents: 5,
            coordinationStrategy: 'round_robin',
            ...config
        };
        this.agents = new Map();
        this.taskQueue = [];
        this.isActive = false;
    }

    async initialize() {
        console.log(`Research Swarm ${this.swarmId} initializing...`);
        
        // Create initial agents
        for (let i = 0; i < this.config.maxAgents; i++) {
            const agent = new ResearchAgent(`agent_${i}`, {
                swarmId: this.swarmId
            });
            await agent.initialize();
            this.agents.set(agent.id, agent);
        }

        this.isActive = true;
        console.log(`Swarm initialized with ${this.agents.size} agents`);
        return true;
    }

    async coordinateResearch(projects, criteria) {
        if (!this.isActive) {
            throw new Error('Swarm not initialized');
        }

        console.log(`Coordinating research for ${projects.length} projects`);
        
        const results = [];
        const agentArray = Array.from(this.agents.values());
        
        // Distribute work among agents
        for (let i = 0; i < projects.length; i++) {
            const agent = agentArray[i % agentArray.length];
            const project = projects[i];
            
            console.log(`Assigning ${project} to ${agent.id}`);
            
            try {
                const result = await agent.researchProject(project, criteria);
                results.push({
                    project,
                    agent: agent.id,
                    result
                });
            } catch (error) {
                console.error(`Research failed for ${project}:`, error);
                results.push({
                    project,
                    agent: agent.id,
                    result: { success: false, error: error.message }
                });
            }
        }

        return {
            swarmId: this.swarmId,
            totalProjects: projects.length,
            results,
            timestamp: new Date().toISOString()
        };
    }

    getSwarmStatus() {
        const agentStates = {};
        this.agents.forEach((agent, id) => {
            agentStates[id] = agent.getState();
        });

        return {
            swarmId: this.swarmId,
            isActive: this.isActive,
            agentCount: this.agents.size,
            agents: agentStates,
            queueSize: this.taskQueue.length
        };
    }

    async addAgent(agentConfig = {}) {
        const agentId = `agent_${this.agents.size}`;
        const agent = new ResearchAgent(agentId, {
            swarmId: this.swarmId,
            ...agentConfig
        });
        
        await agent.initialize();
        this.agents.set(agentId, agent);
        
        console.log(`Added agent ${agentId} to swarm ${this.swarmId}`);
        return agentId;
    }

    async removeAgent(agentId) {
        if (this.agents.has(agentId)) {
            this.agents.delete(agentId);
            console.log(`Removed agent ${agentId} from swarm ${this.swarmId}`);
            return true;
        }
        return false;
    }
}

module.exports = ResearchSwarm;