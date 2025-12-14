import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useFieldHealthSummary, useTriggerHealthAnalysis } from '../../hooks/useHealth';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

type FieldHealthScreenRouteProp = RouteProp<{ params: { fieldId: string } }, 'params'>;

export const FieldHealthScreen: React.FC = () => {
  const route = useRoute<FieldHealthScreenRouteProp>();
  const { fieldId } = route.params;

  const { data: healthData, isLoading, error, refetch } = useFieldHealthSummary(fieldId);
  const triggerAnalysis = useTriggerHealthAnalysis();

  const [refreshing, setRefreshing] = useState(false);

  // Debug logging
  React.useEffect(() => {
    if (__DEV__) {
      console.log('[FieldHealthScreen] Health data:', healthData);
      console.log('[FieldHealthScreen] Loading:', isLoading);
      console.log('[FieldHealthScreen] Error:', error);
      if (healthData?.current) {
        console.log('[FieldHealthScreen] Current health:', {
          ndvi_mean: healthData.current.ndvi_mean,
          ndwi_mean: healthData.current.ndwi_mean,
          tdvi_mean: healthData.current.tdvi_mean,
        });
      }
    }
  }, [healthData, isLoading, error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTriggerAnalysis = () => {
    Alert.alert(
      'Trigger New Analysis',
      'This will request a new health analysis for this field. It may take a few minutes to complete.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Analyze',
          onPress: () => {
            triggerAnalysis.mutate(fieldId, {
              onSuccess: () => {
                Alert.alert('Success', 'Health analysis has been triggered. Check back in a few minutes.');
              },
              onError: (err: any) => {
                Alert.alert('Error', err.message || 'Failed to trigger analysis');
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading field health..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={refetch} />;
  }

  if (!healthData?.current) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Health Data Available</Text>
          <Text style={styles.emptyText}>
            This field doesn't have satellite-derived health data yet. Request an analysis to get NDVI, NDWI, and TDVI indices.
          </Text>
          <TouchableOpacity style={styles.analyzeButton} onPress={handleTriggerAnalysis}>
            <Text style={styles.analyzeButtonText}>
              {triggerAnalysis.isPending ? 'Requesting...' : 'Request Health Analysis'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.emptySubtext}>
            Analysis may take a few minutes to complete. Check back soon!
          </Text>
        </View>
      </ScrollView>
    );
  }

  const { current, history, trends } = healthData;
  
  // Check if we have actual health index data
  const hasHealthData = current.ndvi_mean !== undefined && current.ndvi_mean !== null && current.ndvi_mean !== 0;

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '#10b981';
      case 'good':
        return '#22c55e';
      case 'fair':
        return '#f59e0b';
      case 'poor':
        return '#f97316';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↗️';
      case 'declining':
        return '↘️';
      default:
        return '→';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Health Score Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overall Health Score</Text>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: getHealthColor(current.health_status) }]}>
            {current.health_score.toFixed(1)}
          </Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getHealthColor(current.health_status) }]}>
          <Text style={styles.statusText}>{current.health_status.toUpperCase()}</Text>
        </View>
        
        {/* Trend Indicator */}
        <View style={styles.trendContainer}>
          <Text style={styles.trendLabel}>Trend: </Text>
          <Text style={styles.trendValue}>
            {getTrendIcon(trends.health_score_trend)} {trends.health_score_trend.toUpperCase()}
          </Text>
          <Text style={styles.trendChange}>
            ({trends.change_percentage > 0 ? '+' : ''}
            {trends.change_percentage.toFixed(1)}%)
          </Text>
        </View>
      </View>

      {/* No Data Message */}
      {!hasHealthData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ No Detailed Health Data</Text>
          <Text style={styles.emptyText}>
            Health summary is available, but detailed NDVI/NDWI/TDVI indices are not yet computed. Request a health analysis to get detailed vegetation indices.
          </Text>
          <TouchableOpacity
            style={[styles.analyzeButton, triggerAnalysis.isPending && styles.analyzeButtonDisabled]}
            onPress={handleTriggerAnalysis}
            disabled={triggerAnalysis.isPending}
          >
            <Text style={styles.analyzeButtonText}>
              {triggerAnalysis.isPending ? 'Requesting...' : 'Request Health Analysis'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NDVI Analysis Card */}
      {hasHealthData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌱 NDVI Analysis (Vegetation Health)</Text>
          <View style={styles.ndviGrid}>
            <View style={styles.ndviItem}>
              <Text style={styles.ndviLabel}>Mean</Text>
              <Text style={styles.ndviValue}>{current.ndvi_mean.toFixed(3)}</Text>
            </View>
            {current.ndvi_min !== undefined && current.ndvi_min !== null && (
              <View style={styles.ndviItem}>
                <Text style={styles.ndviLabel}>Min</Text>
                <Text style={styles.ndviValue}>{current.ndvi_min.toFixed(3)}</Text>
              </View>
            )}
            {current.ndvi_max !== undefined && current.ndvi_max !== null && (
              <View style={styles.ndviItem}>
                <Text style={styles.ndviLabel}>Max</Text>
                <Text style={styles.ndviValue}>{current.ndvi_max.toFixed(3)}</Text>
              </View>
            )}
            {current.ndvi_std !== undefined && current.ndvi_std !== null && (
              <View style={styles.ndviItem}>
                <Text style={styles.ndviLabel}>Std Dev</Text>
                <Text style={styles.ndviValue}>{current.ndvi_std.toFixed(3)}</Text>
              </View>
            )}
          </View>

          {/* Progress Bar for Vegetation Cover */}
          {current.vegetation_cover_percentage !== undefined && current.vegetation_cover_percentage !== null && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Vegetation Cover</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${current.vegetation_cover_percentage}%`,
                      backgroundColor: getHealthColor(current.health_status),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{current.vegetation_cover_percentage.toFixed(1)}%</Text>
            </View>
          )}
        </View>
      )}

      {/* NDWI Analysis Card */}
      {(current.ndwi_mean !== undefined && current.ndwi_mean !== null) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💧 NDWI Analysis (Water Content)</Text>
          <View style={styles.ndviGrid}>
            <View style={styles.ndviItem}>
              <Text style={styles.ndviLabel}>Mean</Text>
              <Text style={styles.ndviValue}>{current.ndwi_mean.toFixed(3)}</Text>
            </View>
            {current.ndwi_min !== undefined && current.ndwi_min !== null && (
              <View style={styles.ndviItem}>
                <Text style={styles.ndviLabel}>Min</Text>
                <Text style={styles.ndviValue}>{current.ndwi_min.toFixed(3)}</Text>
              </View>
            )}
            {current.ndwi_max !== undefined && current.ndwi_max !== null && (
              <View style={styles.ndviItem}>
                <Text style={styles.ndviLabel}>Max</Text>
                <Text style={styles.ndviValue}>{current.ndwi_max.toFixed(3)}</Text>
              </View>
            )}
            {current.ndwi_std !== undefined && current.ndwi_std !== null && (
              <View style={styles.ndviItem}>
                <Text style={styles.ndviLabel}>Std Dev</Text>
                <Text style={styles.ndviValue}>{current.ndwi_std.toFixed(3)}</Text>
              </View>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 NDWI indicates water content. Values below 0.1 suggest water stress.
            </Text>
          </View>
        </View>
      )}

      {/* TDVI Analysis Card */}
      {(current.tdvi_mean !== undefined && current.tdvi_mean !== null) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌿 TDVI Analysis (Stress Detection)</Text>
          <View style={styles.ndviGrid}>
            <View style={styles.ndviItem}>
              <Text style={styles.ndviLabel}>Mean</Text>
              <Text style={styles.ndviValue}>{current.tdvi_mean.toFixed(3)}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 TDVI detects plant stress. Higher values (greater than 0.5) may indicate stress conditions.
            </Text>
          </View>
        </View>
      )}

      {/* Stress Areas Card */}
      {current.stress_areas_count > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Stress Areas Detected</Text>
          <View style={styles.stressInfo}>
            <View style={styles.stressItem}>
              <Text style={styles.stressValue}>{current.stress_areas_count}</Text>
              <Text style={styles.stressLabel}>Areas</Text>
            </View>
            <View style={styles.stressItem}>
              <Text style={styles.stressValue}>{current.stress_areas_percentage.toFixed(1)}%</Text>
              <Text style={styles.stressLabel}>of Field</Text>
            </View>
          </View>
        </View>
      )}

      {/* Satellite/NDVI Images */}
      {(current.satellite_image_url || current.ndvi_image_url) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Satellite Imagery</Text>
          {current.satellite_image_url && (
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>RGB Image</Text>
              <Image source={{ uri: current.satellite_image_url }} style={styles.image} resizeMode="cover" />
            </View>
          )}
          {current.ndvi_image_url && (
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>NDVI Heatmap</Text>
              <Image source={{ uri: current.ndvi_image_url }} style={styles.image} resizeMode="cover" />
            </View>
          )}
        </View>
      )}

      {/* Alerts */}
      {current.alerts && current.alerts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 Alerts</Text>
          {current.alerts.map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Text style={styles.alertText}>• {alert}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations from Health Analysis */}
      {current.recommendations && current.recommendations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Quick Recommendations</Text>
          {current.recommendations.map((rec, index) => (
            <View key={index} style={styles.recItem}>
              <Text style={styles.recText}>• {rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Health History Chart (Simple) */}
      {history && history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health History (Last {history.length} Analyses)</Text>
          <View style={styles.historyContainer}>
            {history.slice(0, 10).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(item.analysis_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.historyBar}>
                  <View
                    style={[
                      styles.historyBarFill,
                      {
                        width: `${item.health_score}%`,
                        backgroundColor: getHealthColor(item.health_status),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.historyScore}>{item.health_score.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Analysis Info */}
      <View style={styles.card}>
        <Text style={styles.infoLabel}>Last Analysis</Text>
        <Text style={styles.infoValue}>
          {new Date(current.analysis_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <TouchableOpacity
          style={[styles.analyzeButton, triggerAnalysis.isPending && styles.analyzeButtonDisabled]}
          onPress={handleTriggerAnalysis}
          disabled={triggerAnalysis.isPending}
        >
          <Text style={styles.analyzeButtonText}>
            {triggerAnalysis.isPending ? 'Requesting...' : 'Request New Analysis'}
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
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 32,
    color: '#9ca3af',
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  trendLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  trendChange: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  ndviGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ndviItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ndviLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  ndviValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  progressSection: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
    textAlign: 'right',
  },
  stressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  stressItem: {
    alignItems: 'center',
  },
  stressValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ef4444',
  },
  stressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  imageSection: {
    marginVertical: 8,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  alertItem: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertText: {
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
  historyContainer: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    width: 50,
  },
  historyBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  historyBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  historyScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    width: 30,
    textAlign: 'right',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
});
