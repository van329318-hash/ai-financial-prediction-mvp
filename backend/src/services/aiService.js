const axios = require('axios');

class AIService {
  /**
   * Get prediction from AI engine
   */
  static async getPrediction() {
    try {
      const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';
      const startTime = Date.now();

      const response = await axios.post(`${aiEngineUrl}/api/predict`, {
        // Send historical data or context if needed
        modelVersion: process.env.AI_MODEL_VERSION || 'v1.0'
      }, {
        timeout: 5000
      });

      const processingTime = Date.now() - startTime;

      return {
        result: response.data.prediction || (Math.random() > 0.5 ? 'TAI' : 'XIU'),
        confidence: response.data.confidence || 50,
        taiProb: response.data.taiProb || 50,
        xiuProb: response.data.xiuProb || 50,
        patternType: response.data.patternType || 'RANDOM',
        indicators: response.data.indicators || {},
        processingTime
      };
    } catch (error) {
      console.error('AI Engine Error:', error.message);
      // Fallback prediction (random)
      return {
        result: Math.random() > 0.5 ? 'TAI' : 'XIU',
        confidence: 50,
        taiProb: 50,
        xiuProb: 50,
        patternType: 'RANDOM',
        indicators: { error: 'AI Engine unavailable' },
        processingTime: 0
      };
    }
  }

  /**
   * Train model with historical data
   */
  static async trainModel(historicalData) {
    try {
      const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';

      const response = await axios.post(`${aiEngineUrl}/api/train`, {
        data: historicalData,
        modelVersion: process.env.AI_MODEL_VERSION || 'v1.0'
      }, {
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('Model Training Error:', error.message);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  static async getModelMetrics() {
    try {
      const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';

      const response = await axios.get(`${aiEngineUrl}/api/metrics`, {
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      console.error('Model Metrics Error:', error.message);
      return null;
    }
  }
}

module.exports = AIService;
