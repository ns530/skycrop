import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useFieldYieldSummary, useTriggerYieldPrediction } from '../../hooks/useYield';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

type FieldYieldScreenRouteProp = RouteProp<{ params: { fieldId: number } }, 'params'>;

export const FieldYieldScreen: React.FC = () => {
  const route = useRoute<FieldYieldScreenRouteProp>();
  const { fieldId } = route.params;

  const { data: yieldData, isLoading, error, refetch } = useFieldYieldSummary(fieldId);
  const triggerPrediction = useTriggerYieldPrediction();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTriggerPrediction = () => {
    Alert.alert(
      'Trigger New Prediction',
      'This will request a new yield prediction for this field using AI models. It may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Predict',
          onPress: () => {
            triggerPrediction.mutate(fieldId, {
              onSuccess: () => {
                Alert.alert('Success', 'Yield prediction has been triggered. Check back in a few minutes.');
              },
              onError: (err: any) => {
                Alert.alert('Error', err.message || 'Failed to trigger prediction');
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading yield data..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={refetch} />;
  }

  if (!yieldData?.current_prediction) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No yield prediction available</Text>
        <TouchableOpacity style={styles.predictButton} onPress={handleTriggerPrediction}>
          <Text style={styles.predictButtonText}>Request Prediction</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { current_prediction, history, trends } = yieldData;

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return '#10b981';
      case 'good':
        return '#22c55e';
      case 'fair':
        return '#f59e0b';
      case 'poor':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  const confidencePercentage = (current_prediction.confidence_score * 100).toFixed(0);
  const confidenceWidth = `${confidencePercentage}%` as const;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Predicted Yield Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Predicted Yield</Text>
        <View style={styles.yieldContainer}>
          <View style={styles.yieldMain}>
            <Text style={styles.yieldValue}>{current_prediction.predicted_yield.toFixed(2)}</Text>
            <Text style={styles.yieldUnit}>tons</Text>
          </View>
          <View style={styles.yieldPerHectare}>
            <Text style={styles.yieldPerHectareValue}>
              {current_prediction.predicted_yield_per_hectare.toFixed(2)}
            </Text>
            <Text style={styles.yieldPerHectareUnit}>tons/hectare</Text>
          </View>
        </View>

        {/* Confidence Score */}
        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceLabel}>Confidence Score</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: confidenceWidth as any,
                  backgroundColor: current_prediction.confidence_score > 0.8 ? '#10b981' : '#f59e0b',
                },
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>{confidencePercentage}%</Text>
        </View>

        {/* Confidence Interval */}
        <View style={styles.intervalSection}>
          <Text style={styles.intervalLabel}>Confidence Interval (95%)</Text>
          <View style={styles.intervalRange}>
            <View style={styles.intervalItem}>
              <Text style={styles.intervalValue}>{current_prediction.confidence_interval_lower.toFixed(2)}</Text>
              <Text style={styles.intervalText}>Lower</Text>
            </View>
            <View style={styles.intervalDivider} />
            <View style={styles.intervalItem}>
              <Text style={styles.intervalValue}>{current_prediction.confidence_interval_upper.toFixed(2)}</Text>
              <Text style={styles.intervalText}>Upper</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Crop & Quality Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Crop Information</Text>
        <View style={styles.cropGrid}>
          <View style={styles.cropItem}>
            <Text style={styles.cropLabel}>Crop Type</Text>
            <Text style={styles.cropValue}>{current_prediction.crop_type}</Text>
          </View>
          <View style={styles.cropItem}>
            <Text style={styles.cropLabel}>Quality Estimate</Text>
            <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(current_prediction.quality_estimate) }]}>
              <Text style={styles.qualityText}>{current_prediction.quality_estimate.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {current_prediction.harvest_date_estimate && (
          <View style={styles.harvestDate}>
            <Text style={styles.harvestLabel}>🗓️ Estimated Harvest Date</Text>
            <Text style={styles.harvestValue}>
              {new Date(current_prediction.harvest_date_estimate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Trend Card */}
      {trends && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yield Trends</Text>
          <View style={styles.trendContainer}>
            <View style={styles.trendItem}>
              <Text style={styles.trendIcon}>{getTrendIcon(trends.yield_trend)}</Text>
              <Text style={styles.trendLabel}>Trend</Text>
              <Text style={styles.trendValue}>{trends.yield_trend.toUpperCase()}</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendItem}>
              <Text style={styles.trendIcon}>📊</Text>
              <Text style={styles.trendLabel}>3-Year Avg</Text>
              <Text style={styles.trendValue}>{trends.average_yield_last_3_years.toFixed(2)} tons</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendItem}>
              <Text style={styles.trendIcon}>
                {trends.change_percentage > 0 ? '⬆️' : trends.change_percentage < 0 ? '⬇️' : '➡️'}
              </Text>
              <Text style={styles.trendLabel}>Change</Text>
              <Text
                style={[
                  styles.trendValue,
                  {
                    color:
                      trends.change_percentage > 0 ? '#10b981' : trends.change_percentage < 0 ? '#ef4444' : '#6b7280',
                  },
                ]}
              >
                {trends.change_percentage > 0 ? '+' : ''}
                {trends.change_percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Risk Factors */}
      {current_prediction.risk_factors && current_prediction.risk_factors.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Risk Factors</Text>
          {current_prediction.risk_factors.map((risk: string, index: number) => (
            <View key={index} style={styles.riskItem}>
              <Text style={styles.riskText}>• {risk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {current_prediction.recommendations && current_prediction.recommendations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Recommendations</Text>
          {current_prediction.recommendations.map((rec: string, index: number) => (
            <View key={index} style={styles.recItem}>
              <Text style={styles.recText}>• {rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Historical Data Chart (Simple Bar Chart) */}
      {history && history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historical Yield (Last {Math.min(history.length, 5)} Years)</Text>
          <View style={styles.chartContainer}>
            {history.slice(0, 5).reverse().map((item: any, index: number) => {
              const maxYield = Math.max(...history.map((h: any) => h.actual_yield));
              const barHeight = (item.actual_yield / maxYield) * 150;
              const hasPrediction = item.predicted_yield !== null;
              const accuracy = hasPrediction
                ? (1 - Math.abs(item.actual_yield - (item.predicted_yield || 0)) / item.actual_yield) * 100
                : null;

              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    {/* Predicted Yield (if available) */}
                    {hasPrediction && item.predicted_yield && (
                      <View
                        style={[
                          styles.barPredicted,
                          {
                            height: ((item.predicted_yield / maxYield) * 150),
                          },
                        ]}
                      />
                    )}
                    {/* Actual Yield */}
                    <View
                      style={[
                        styles.barActual,
                        {
                          height: barHeight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{item.actual_yield.toFixed(1)}</Text>
                  {accuracy !== null && (
                    <Text style={styles.barAccuracy}>({accuracy.toFixed(0)}%)</Text>
                  )}
                  <Text style={styles.barYear}>{item.year}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#f59e0b', opacity: 0.5 }]} />
              <Text style={styles.legendText}>Predicted</Text>
            </View>
          </View>
        </View>
      )}

      {/* Prediction Info */}
      <View style={styles.card}>
        <Text style={styles.infoLabel}>Prediction Method</Text>
        <Text style={styles.infoValue}>{current_prediction.prediction_method}</Text>
        
        <Text style={styles.infoLabel}>Factors Considered</Text>
        <View style={styles.factorsContainer}>
          {current_prediction.factors_considered.map((factor: string, index: number) => (
            <View key={index} style={styles.factorChip}>
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.infoLabel}>Prediction Date</Text>
        <Text style={styles.infoValue}>
          {new Date(current_prediction.prediction_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <TouchableOpacity
          style={[styles.predictButton, triggerPrediction.isPending && styles.predictButtonDisabled]}
          onPress={handleTriggerPrediction}
          disabled={triggerPrediction.isPending}
        >
          <Text style={styles.predictButtonText}>
            {triggerPrediction.isPending ? 'Requesting...' : 'Request New Prediction'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  yieldContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  yieldMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  yieldValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10b981',
  },
  yieldUnit: {
    fontSize: 24,
    color: '#6b7280',
    marginLeft: 8,
  },
  yieldPerHectare: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  yieldPerHectareValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
  },
  yieldPerHectareUnit: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 4,
  },
  confidenceSection: {
    marginTop: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
    textAlign: 'right',
  },
  intervalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  intervalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  intervalRange: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  intervalItem: {
    alignItems: 'center',
  },
  intervalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6b7280',
  },
  intervalText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  intervalDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  cropGrid: {
    gap: 12,
  },
  cropItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  cropLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  cropValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  qualityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  qualityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  harvestDate: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  harvestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  harvestValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  trendItem: {
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  trendDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  riskItem: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  riskText: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  recItem: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  recText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    marginTop: 16,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 150,
    width: '80%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  barPredicted: {
    width: '60%',
    backgroundColor: '#f59e0b',
    opacity: 0.5,
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  barActual: {
    width: '80%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  barAccuracy: {
    fontSize: 10,
    color: '#6b7280',
  },
  barYear: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  factorChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  factorText: {
    fontSize: 12,
    color: '#1e40af',
  },
  predictButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  predictButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
