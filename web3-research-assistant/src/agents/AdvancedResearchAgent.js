const ResearchAgent = require('./ResearchAgent');
const juliaos = require('../integrations/juliaos');

class AdvancedResearchAgent extends ResearchAgent {
    constructor(id, config) {
        super(id, config);
        this.specializations = config.specializations || [];
        this.learningRate = config.learningRate || 0.1;
    }

    async adaptiveLearning(feedback) {
        // Adjust agent behavior based on feedback
        this.config.temperature = Math.max(0.1, 
            Math.min(0.9, this.config.temperature + (feedback.rating * this.learningRate))
        );
        
        if (feedback.suggestedFocus) {
            this.specializations = [
                ...new Set([...this.specializations, ...feedback.suggestedFocus])
            ];
        }
        
        // Report learning update to JuliaOS
        await juliaos.updateAgent(this.id, {
            config: this.config,
            metadata: {
                lastLearning: new Date().toISOString(),
                learningCount: (this.metadata.learningCount || 0) + 1
            }
        });
    }

    async conductResearch(projectName, criteria) {
        // Enhanced research with specialization focus
        const prompt = `As a ${this.specializations.join(', ')} specialist, analyze ${projectName} focusing on ${criteria.join(', ')}`;
        
        const researchResult = await this.useLLM(prompt, {
            researchType: 'advanced',
            specialization: this.specializations
        });
        
        if (researchResult.success) {
            return this._formatAdvancedReport(researchResult.data, projectName);
        }
        
        return researchResult;
    }

    _formatAdvancedReport(data, projectName) {
        // Process the LLM response into structured format
        return {
            project: projectName,
            analysis: data.analysis,
            confidence: data.confidenceScore,
            specializationsUsed: this.specializations,
            recommendations: data.recommendations,
            risks: data.riskAssessment,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = AdvancedResearchAgent;