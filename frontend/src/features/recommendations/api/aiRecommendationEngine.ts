/**
 * AI Recommendation Engine
 * 
 * Intelligent recommendation system that analyzes field data
 * and generates actionable advice for farmers.
 * 
 * This is a sophisticated mock that simulates real AI decision-making
 * based on health, weather, yield, and growth stage data.
 */

import type { HealthIndexPoint } from '../../health/api/healthApi';
import type { Recommendation, RecommendationPriority } from './recommendationApi';

// --------------------
// Types
// --------------------

export interface FieldAnalysisInput {
  fieldId: string;
  fieldName: string;
  areaHa: number;
  healthData?: {
    ndvi: number;
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
    trend: 'improving' | 'stable' | 'declining';
    timeSeries?: HealthIndexPoint[];
  };
  weatherData?: {
    temperature: number; // Celsius
    rainfall: number; // mm in last 7 days
    humidity: number; // percentage
    forecast?: string; // e.g., "Heavy rain expected"
  };
  yieldData?: {
    predictedYield: number; // kg/ha
    lastActualYield?: number; // kg/ha
  };
  growthStage?: 'vegetative' | 'reproductive' | 'ripening' | 'harvest';
  lastIrrigationDays?: number;
  lastFertilizerDays?: number;
}

interface RecommendationRule {
  id: string;
  condition: (input: FieldAnalysisInput) => boolean;
  priority: RecommendationPriority;
  generate: (input: FieldAnalysisInput) => Omit<Recommendation, 'id' | 'fieldId' | 'recommendedAt'>;
}

// --------------------
// AI Recommendation Rules
// --------------------

/**
 * Rule 1: Critical - Low NDVI with declining trend
 */
const criticalHealthRule: RecommendationRule = {
  id: 'critical-health',
  condition: (input) =>
    input.healthData !== undefined &&
    input.healthData.ndvi < 0.4 &&
    input.healthData.trend === 'declining',
  priority: 'high',
  generate: (input) => ({
    title: '🚨 Urgent: Severe Stress Detected',
    description: `Your field shows critical stress with NDVI of ${input.healthData!.ndvi.toFixed(2)}. Immediate action required to prevent crop failure.`,
    status: 'overdue',
    priority: 'high',
    applyBefore: getDateDaysFromNow(2),
    weatherHint: input.weatherData?.forecast,
  }),
};

/**
 * Rule 2: Water stress detected
 */
const waterStressRule: RecommendationRule = {
  id: 'water-stress',
  condition: (input) =>
    input.healthData !== undefined &&
    input.healthData.ndvi < 0.6 &&
    input.weatherData !== undefined &&
    input.weatherData.rainfall < 10 &&
    (input.lastIrrigationDays === undefined || input.lastIrrigationDays > 7),
  priority: 'high',
  generate: (input) => {
    const lastIrrigation = input.lastIrrigationDays || 'unknown';
    return {
      title: '💧 Apply Irrigation',
      description: `Low rainfall (${input.weatherData!.rainfall}mm) and declining health indicate water stress. Last irrigation: ${lastIrrigation} days ago.`,
      status: 'planned',
      priority: 'high',
      applyBefore: getDateDaysFromNow(3),
      weatherHint: input.weatherData?.forecast || 'Dry conditions expected',
    };
  },
};

/**
 * Rule 3: Fertilizer needed (vegetative stage)
 */
const vegetativeFertilizerRule: RecommendationRule = {
  id: 'vegetative-fertilizer',
  condition: (input) =>
    input.growthStage === 'vegetative' &&
    (input.lastFertilizerDays === undefined || input.lastFertilizerDays > 15) &&
    input.healthData !== undefined &&
    input.healthData.ndvi < 0.7,
  priority: 'medium',
  generate: (input) => ({
    title: '🌱 Apply Nitrogen Fertilizer',
    description: `Your field is in the vegetative stage and needs nitrogen boost. Current NDVI: ${input.healthData!.ndvi.toFixed(2)}. Recommended: 40kg/ha urea.`,
    status: 'planned',
    priority: 'medium',
    applyBefore: getDateDaysFromNow(7),
    weatherHint: input.weatherData?.forecast,
  }),
};

/**
 * Rule 4: Reproductive stage fertilizer
 */
const reproductiveFertilizerRule: RecommendationRule = {
  id: 'reproductive-fertilizer',
  condition: (input) =>
    input.growthStage === 'reproductive' &&
    (input.lastFertilizerDays === undefined || input.lastFertilizerDays > 20),
  priority: 'medium',
  generate: (input) => ({
    title: '🌾 Apply Phosphorus & Potassium',
    description: 'Your paddy is flowering. Apply P&K fertilizer to boost grain formation. Recommended: 30kg/ha NPK (0-20-20).',
    status: 'planned',
    priority: 'medium',
    applyBefore: getDateDaysFromNow(5),
    weatherHint: 'Apply when no rain expected for 2 days',
  }),
};

/**
 * Rule 5: Pest risk (high humidity + good health)
 */
const pestRiskRule: RecommendationRule = {
  id: 'pest-risk',
  condition: (input) =>
    input.weatherData !== undefined &&
    input.weatherData.humidity > 80 &&
    input.healthData !== undefined &&
    input.healthData.healthStatus === 'good' &&
    input.growthStage === 'reproductive',
  priority: 'medium',
  generate: (input) => ({
    title: '🐛 Monitor for Pests',
    description: `High humidity (${input.weatherData!.humidity}%) during flowering increases pest risk. Inspect for brown plant hopper and leaf folder.`,
    status: 'planned',
    priority: 'medium',
    applyBefore: getDateDaysFromNow(3),
    weatherHint: 'Monitor daily until humidity drops',
  }),
};

/**
 * Rule 6: Drain field before heavy rain
 */
const drainBeforeRainRule: RecommendationRule = {
  id: 'drain-before-rain',
  condition: (input) =>
    input.weatherData !== undefined &&
    input.weatherData.forecast !== undefined &&
    input.weatherData.forecast.toLowerCase().includes('heavy rain'),
  priority: 'high',
  generate: (input) => ({
    title: '🌧️ Drain Excess Water',
    description: `Heavy rain forecast: "${input.weatherData!.forecast}". Drain field to prevent waterlogging and disease.`,
    status: 'planned',
    priority: 'high',
    applyBefore: getDateDaysFromNow(1),
    weatherHint: input.weatherData!.forecast,
  }),
};

/**
 * Rule 7: Harvest timing
 */
const harvestTimingRule: RecommendationRule = {
  id: 'harvest-timing',
  condition: (input) =>
    input.growthStage === 'ripening' &&
    input.healthData !== undefined &&
    input.healthData.ndvi < 0.5,
  priority: 'high',
  generate: (input) => ({
    title: '🌾 Prepare for Harvest',
    description: `NDVI declining to ${input.healthData!.ndvi.toFixed(2)} indicates ripening complete. Plan harvest within 1-2 weeks for optimal yield.`,
    status: 'planned',
    priority: 'high',
    applyBefore: getDateDaysFromNow(7),
    weatherHint: 'Harvest on a sunny day to avoid grain moisture issues',
  }),
};

/**
 * Rule 8: Improving health - maintain current practices
 */
const maintainHealthRule: RecommendationRule = {
  id: 'maintain-health',
  condition: (input) =>
    input.healthData !== undefined &&
    input.healthData.trend === 'improving' &&
    input.healthData.healthStatus === 'excellent',
  priority: 'low',
  generate: (input) => ({
    title: '✅ Continue Current Practices',
    description: `Your field health is improving (NDVI: ${input.healthData!.ndvi.toFixed(2)}). Maintain current irrigation and fertilization schedule.`,
    status: 'planned',
    priority: 'low',
    weatherHint: 'Monitor for any sudden changes',
  }),
};

/**
 * Rule 9: Yield prediction low - intensify care
 */
const yieldBoostRule: RecommendationRule = {
  id: 'yield-boost',
  condition: (input) =>
    input.yieldData !== undefined &&
    input.yieldData.predictedYield < 3500 &&
    input.growthStage === 'vegetative',
  priority: 'medium',
  generate: (input) => ({
    title: '📊 Yield Below Target',
    description: `Predicted yield: ${input.yieldData!.predictedYield}kg/ha. Increase fertilizer and ensure consistent water supply to reach 4000kg/ha target.`,
    status: 'planned',
    priority: 'medium',
    applyBefore: getDateDaysFromNow(10),
    weatherHint: 'Act now while plants are still in growth phase',
  }),
};

/**
 * Rule 10: Disease risk (declining trend + high rainfall)
 */
const diseaseRiskRule: RecommendationRule = {
  id: 'disease-risk',
  condition: (input) =>
    input.healthData !== undefined &&
    input.healthData.trend === 'declining' &&
    input.weatherData !== undefined &&
    input.weatherData.rainfall > 50,
  priority: 'high',
  generate: (input) => ({
    title: '🦠 Disease Risk Detected',
    description: `Declining health with heavy rainfall (${input.weatherData!.rainfall}mm) suggests possible fungal disease. Inspect for blast or sheath blight.`,
    status: 'planned',
    priority: 'high',
    applyBefore: getDateDaysFromNow(2),
    weatherHint: 'Apply fungicide if disease confirmed',
  }),
};

// --------------------
// Rule Registry
// --------------------

const ALL_RULES: RecommendationRule[] = [
  criticalHealthRule,
  waterStressRule,
  drainBeforeRainRule,
  diseaseRiskRule,
  vegetativeFertilizerRule,
  reproductiveFertilizerRule,
  harvestTimingRule,
  pestRiskRule,
  yieldBoostRule,
  maintainHealthRule,
];

// --------------------
// Public AI Engine
// --------------------

/**
 * Generate AI recommendations for a field
 * 
 * @param input - Field analysis data
 * @returns Array of generated recommendations
 */
export const generateAIRecommendations = (input: FieldAnalysisInput): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Evaluate each rule
  for (const rule of ALL_RULES) {
    try {
      if (rule.condition(input)) {
        const rec = rule.generate(input);
        recommendations.push({
          ...rec,
          id: `ai-${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fieldId: input.fieldId,
          recommendedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn(`Rule ${rule.id} failed:`, error);
      // Continue processing other rules
    }
  }

  // Sort by priority (high > medium > low)
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Limit to top 5 recommendations to avoid overwhelming farmer
  return recommendations.slice(0, 5);
};

/**
 * Explain why a recommendation was generated (for transparency)
 */
export const explainRecommendation = (recommendationId: string, input: FieldAnalysisInput): string => {
  const ruleId = recommendationId.split('-')[1]; // Extract rule ID
  const rule = ALL_RULES.find((r) => r.id === ruleId);

  if (!rule) {
    return 'This recommendation was generated based on field analysis.';
  }

  // Build explanation based on input data
  const factors: string[] = [];

  if (input.healthData) {
    factors.push(`NDVI: ${input.healthData.ndvi.toFixed(2)}`);
    factors.push(`Status: ${input.healthData.healthStatus}`);
    factors.push(`Trend: ${input.healthData.trend}`);
  }

  if (input.weatherData) {
    factors.push(`Rainfall: ${input.weatherData.rainfall}mm`);
    factors.push(`Humidity: ${input.weatherData.humidity}%`);
  }

  if (input.growthStage) {
    factors.push(`Growth stage: ${input.growthStage}`);
  }

  return `AI Analysis: ${factors.join(' | ')}`;
};

// --------------------
// Helper Functions
// --------------------

function getDateDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

