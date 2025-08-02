// src/agents/ResearchAgent.js
const axios = require('axios');

class ResearchAgent {
    constructor(id, config = {}) {
        this.id = id;
        this.config = {
            maxTokens: 1000,
            temperature: 0.7,
            apiUrl: process.env.JULIAOS_API_URL || 'https://api.juliaos.com',
            apiKey: process.env.JULIAOS_API_KEY,
            ...config
        };
        this.state = {
            isActive: false,
            currentTask: null,
            researchHistory: []
        };
        
        // Create axios instance for API calls
        this.apiClient = axios.create({
            baseURL: this.config.apiUrl,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async initialize() {
        console.log(`Research Agent ${this.id} initializing...`);
        this.state.isActive = true;
        return true;
    }

    async useLLM(prompt, context = {}) {
        try {
            console.log(`Agent ${this.id} processing: ${prompt.substring(0, 100)}...`);
            
            // First try to get onchain data if needed
            let onchainData = null;
            if (context.projectName && !context.skipOnchain) {
                try {
                    onchainData = await this.researchOnchainData(context.projectName);
                } catch (error) {
                    console.warn(`Onchain research failed for ${context.projectName}:`, error.message);
                    // Continue without onchain data
                }
            }
            
            // Call JuliaOS LLM API
            const response = await this.callJuliaOSLLM(prompt, {
                ...context,
                onchainData,
                config: this.config
            });
            
            return {
                success: true,
                data: response,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`LLM call failed for agent ${this.id}:`, error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async callJuliaOSLLM(prompt, context) {
        // Check if we're in test environment
        if (process.env.NODE_ENV === 'test') {
            return this.mockLLMResponse(prompt, context);
        }

        try {
            const response = await this.apiClient.post('/v1/llm', {
                prompt,
                context
            });
            
            return response.data;
        } catch (error) {
            console.error(`JuliaOS API Error: ${error.message}`);
            throw error;
        }
    }

    // Mock response for testing
    mockLLMResponse(prompt, context) {
        const projectName = context.projectName || 'Unknown Project';
        return {
            analysis: `Research analysis for: ${projectName}. ${prompt}`,
            confidence: 0.85,
            sources: ['example.com', 'blockchain-news.io'],
            summary: `Based on the research query, here's what I found about ${projectName}...`,
            recommendations: [
                'Consider the project\'s tokenomics carefully',
                'Evaluate the team\'s track record and experience',
                'Assess community engagement and adoption metrics',
                'Review the technology stack and security audits'
            ],
            metadata: {
                processingTime: '1.2s',
                tokensUsed: 156,
                model: 'gpt-4'
            }
        };
    }

    async researchOnchainData(projectName) {
        // Check if we're in test environment
        if (process.env.NODE_ENV === 'test') {
            return this.mockOnchainData(projectName);
        }

        try {
            const response = await this.apiClient.post('/v1/blockchain/query', {
                chain: 'solana',
                method: 'searchProject',
                params: { name: projectName }
            });
            
            return response.data;
        } catch (error) {
            console.error(`JuliaOS API Error: ${error.message}`);
            throw error;
        }
    }

    // Mock onchain data for testing
    mockOnchainData(projectName) {
        return {
            tokenAddress: 'So11111111111111111111111111111111111111112',
            decimals: 9,
            totalSupply: '1000000000',
            holders: 150000,
            liquidityPools: [
                { dex: 'Raydium', tvl: '$2.5M' },
                { dex: 'Orca', tvl: '$1.8M' }
            ],
            recentTransactions: 4520,
            projectName
        };
    }

    async researchProject(projectName, criteria = []) {
        const prompt = `Research the Web3 project "${projectName}". Focus on: ${criteria.join(', ')}`;
        
        this.state.currentTask = {
            type: 'project_research',
            target: projectName,
            startTime: new Date().toISOString()
        };

        try {
            const result = await this.useLLM(prompt, { 
                projectName, 
                criteria,
                agentId: this.id 
            });

            if (result.success) {
                this.state.researchHistory.push({
                    project: projectName,
                    criteria,
                    result: result.data,
                    timestamp: result.timestamp
                });
            }

            return result;
        } finally {
            this.state.currentTask = null;
        }
    }

    getState() {
        return { ...this.state };
    }

    getHistory() {
        return [...this.state.researchHistory];
    }

    clearHistory() {
        this.state.researchHistory = [];
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

module.exports = ResearchAgent;