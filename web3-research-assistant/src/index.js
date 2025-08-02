const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ResearchSwarm = require('./swarms/ResearchSwarm');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Global swarm instance
let researchSwarm;

// Initialize JuliaOS components
async function initializeJuliaOS() {
    console.log('Initializing JuliaOS Research Assistant...');
    
    try {
        // Initialize the research swarm
        researchSwarm = new ResearchSwarm('main_research_swarm', {
            maxAgents: 3
        });
        
        await researchSwarm.initialize();
        console.log('JuliaOS components initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize JuliaOS:', error);
        return false;
    }
}

// API Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Web3 Research Assistant API',
        version: '1.0.0',
        powered_by: 'JuliaOS',
        endpoints: {
            '/api/research': 'POST - Research projects',
            '/api/status': 'GET - Get swarm status',
            '/api/agents': 'GET - List agents',
            '/api/history': 'GET - Get research history'
        }
    });
});

app.post('/api/research', async (req, res) => {
    try {
        const { projects, criteria = [] } = req.body;
        
        if (!projects || !Array.isArray(projects) || projects.length === 0) {
            return res.status(400).json({
                error: 'Please provide an array of project names to research'
            });
        }

        console.log(`Research request for: ${projects.join(', ')}`);
        
        const result = await researchSwarm.coordinateResearch(projects, criteria);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Research request failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/status', (req, res) => {
    try {
        const status = researchSwarm.getSwarmStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/agents', (req, res) => {
    try {
        const status = researchSwarm.getSwarmStatus();
        res.json({
            success: true,
            data: {
                swarmId: status.swarmId,
                agentCount: status.agentCount,
                agents: status.agents
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/history', (req, res) => {
    try {
        const history = [];
        researchSwarm.agents.forEach((agent, id) => {
            const agentHistory = agent.getHistory();
            history.push({
                agentId: id,
                researchCount: agentHistory.length,
                history: agentHistory
            });
        });

        res.json({
            success: true,
            data: {
                swarmId: researchSwarm.swarmId,
                totalAgents: researchSwarm.agents.size,
                agentHistories: history
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
async function startServer() {
    const initialized = await initializeJuliaOS();
    
    if (!initialized) {
        console.error('Failed to initialize JuliaOS. Exiting...');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Web3 Research Assistant running on port ${PORT}`);
        console.log(`📊 API documentation available at http://localhost:${PORT}/`);
        console.log(`🤖 Swarm status: http://localhost:${PORT}/api/status`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

// Start the application
startServer().catch(console.error);