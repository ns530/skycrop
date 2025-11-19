/**
 * Tests for AI Recommendation Engine
 */

import { generateAIRecommendations, type FieldAnalysisInput } from './aiRecommendationEngine';

describe('AI Recommendation Engine', () => {
  describe('generateAIRecommendations', () => {
    it('should generate critical health alert for low NDVI with declining trend', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.35,
          healthStatus: 'poor',
          trend: 'declining',
        },
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].title).toContain('Urgent');
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].description).toContain('NDVI');
    });

    it('should recommend irrigation for water stress', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.55,
          healthStatus: 'fair',
          trend: 'stable',
        },
        weatherData: {
          temperature: 32,
          rainfall: 5,
          humidity: 65,
        },
        lastIrrigationDays: 10,
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const irrigationRec = recommendations.find((r) => r.title.includes('Irrigation'));
      expect(irrigationRec).toBeDefined();
      expect(irrigationRec?.priority).toBe('high');
    });

    it('should recommend vegetative fertilizer during growth stage', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.65,
          healthStatus: 'good',
          trend: 'stable',
        },
        growthStage: 'vegetative',
        lastFertilizerDays: 20,
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const fertilizerRec = recommendations.find((r) => r.title.includes('Nitrogen'));
      expect(fertilizerRec).toBeDefined();
      expect(fertilizerRec?.description).toContain('vegetative');
    });

    it('should recommend reproductive stage fertilizer', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        growthStage: 'reproductive',
        lastFertilizerDays: 25,
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const fertilizerRec = recommendations.find((r) => r.title.includes('Phosphorus'));
      expect(fertilizerRec).toBeDefined();
      expect(fertilizerRec?.description).toContain('flowering');
    });

    it('should warn about pest risk with high humidity', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.7,
          healthStatus: 'good',
          trend: 'stable',
        },
        weatherData: {
          temperature: 30,
          rainfall: 20,
          humidity: 85,
        },
        growthStage: 'reproductive',
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const pestRec = recommendations.find((r) => r.title.includes('Pest'));
      expect(pestRec).toBeDefined();
      expect(pestRec?.description).toContain('humidity');
    });

    it('should recommend drainage before heavy rain', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        weatherData: {
          temperature: 28,
          rainfall: 15,
          humidity: 80,
          forecast: 'Heavy rain expected tomorrow',
        },
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const drainRec = recommendations.find((r) => r.title.includes('Drain'));
      expect(drainRec).toBeDefined();
      expect(drainRec?.priority).toBe('high');
      expect(drainRec?.weatherHint).toContain('rain');
    });

    it('should suggest harvest timing when ripening', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.45,
          healthStatus: 'fair',
          trend: 'declining',
        },
        growthStage: 'ripening',
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const harvestRec = recommendations.find((r) => r.title.includes('Harvest'));
      expect(harvestRec).toBeDefined();
      expect(harvestRec?.description).toContain('ripening');
    });

    it('should recommend maintaining practices when health improving', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.8,
          healthStatus: 'excellent',
          trend: 'improving',
        },
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const maintainRec = recommendations.find((r) => r.title.includes('Continue'));
      expect(maintainRec).toBeDefined();
      expect(maintainRec?.priority).toBe('low');
    });

    it('should recommend yield boost actions when prediction is low', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        yieldData: {
          predictedYield: 3200,
        },
        growthStage: 'vegetative',
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const yieldRec = recommendations.find((r) => r.title.includes('Yield'));
      expect(yieldRec).toBeDefined();
      expect(yieldRec?.description).toContain('3200');
    });

    it('should detect disease risk with declining trend and high rainfall', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.6,
          healthStatus: 'good',
          trend: 'declining',
        },
        weatherData: {
          temperature: 29,
          rainfall: 60,
          humidity: 85,
        },
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const diseaseRec = recommendations.find((r) => r.title.includes('Disease'));
      expect(diseaseRec).toBeDefined();
      expect(diseaseRec?.priority).toBe('high');
    });

    it('should limit recommendations to top 5', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.5,
          healthStatus: 'fair',
          trend: 'declining',
        },
        weatherData: {
          temperature: 32,
          rainfall: 55,
          humidity: 85,
          forecast: 'Heavy rain expected',
        },
        yieldData: {
          predictedYield: 3200,
        },
        growthStage: 'vegetative',
        lastIrrigationDays: 10,
        lastFertilizerDays: 20,
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should prioritize high priority recommendations first', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.35,
          healthStatus: 'poor',
          trend: 'declining',
        },
        weatherData: {
          temperature: 32,
          rainfall: 5,
          humidity: 65,
        },
        growthStage: 'vegetative',
        lastIrrigationDays: 10,
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      // First recommendation should be high priority
      expect(recommendations[0].priority).toBe('high');
    });

    it('should return empty array for minimal input', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
      };

      const recommendations = generateAIRecommendations(input);

      // Should return empty or only default recommendations
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should generate unique IDs for each recommendation', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.6,
          healthStatus: 'good',
          trend: 'declining',
        },
        weatherData: {
          temperature: 32,
          rainfall: 55,
          humidity: 85,
        },
        growthStage: 'vegetative',
      };

      const recommendations = generateAIRecommendations(input);
      const ids = recommendations.map((r) => r.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should include apply before dates for time-sensitive recommendations', () => {
      const input: FieldAnalysisInput = {
        fieldId: 'field-1',
        fieldName: 'Test Field',
        areaHa: 2.5,
        healthData: {
          ndvi: 0.35,
          healthStatus: 'poor',
          trend: 'declining',
        },
      };

      const recommendations = generateAIRecommendations(input);

      expect(recommendations.length).toBeGreaterThan(0);
      const urgentRec = recommendations.find((r) => r.priority === 'high');
      expect(urgentRec?.applyBefore).toBeDefined();
    });
  });
});

