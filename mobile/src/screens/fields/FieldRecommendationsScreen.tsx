import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  useFieldRecommendations,
  useGenerateRecommendations,
  useUpdateRecommendationStatus,
} from '../../hooks/useRecommendations';
import { Recommendation } from '../../api/recommendationsApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState } from '../../components/EmptyState';

type FieldRecommendationsScreenRouteProp = RouteProp<{ params: { fieldId: number } }, 'params'>;

export const FieldRecommendationsScreen: React.FC = () => {
  const route = useRoute<FieldRecommendationsScreenRouteProp>();
  const { fieldId } = route.params;

  const { data: recommendations, isLoading, error, refetch } = useFieldRecommendations(fieldId);
  const generateRecs = useGenerateRecommendations();
  const updateStatus = useUpdateRecommendationStatus();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleGenerateRecommendations = () => {
    Alert.alert(
      'Generate Recommendations',
      'This will request new AI-powered recommendations for this field. It may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: () => {
            generateRecs.mutate(fieldId, {
              onSuccess: () => {
                Alert.alert('Success', 'Recommendations generation started. Check back in a few minutes.');
              },
              onError: (err: any) => {
                Alert.alert('Error', err.message || 'Failed to generate recommendations');
              },
            });
          },
        },
      ]
    );
  };

  const handleStatusChange = (rec: Recommendation, newStatus: Recommendation['status']) => {
    updateStatus.mutate(
      { fieldId, recommendationId: rec.id, status: newStatus },
      {
        onSuccess: () => {
          Alert.alert('Success', `Recommendation marked as ${newStatus}`);
          setModalVisible(false);
        },
        onError: (err: any) => {
          Alert.alert('Error', err.message || 'Failed to update status');
        },
      }
    );
  };

  const openRecommendationDetail = (rec: Recommendation) => {
    setSelectedRec(rec);
    setModalVisible(true);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading recommendations..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={refetch} />;
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="💡"
          title="No Recommendations Yet"
          message="Generate AI-powered recommendations for this field"
        />
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateRecommendations}
          disabled={generateRecs.isPending}
        >
          <Text style={styles.generateButtonText}>
            {generateRecs.isPending ? 'Generating...' : 'Generate Recommendations'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'irrigation':
        return '#3b82f6';
      case 'fertilization':
        return '#22c55e';
      case 'pest_control':
        return '#ef4444';
      case 'harvest':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#3b82f6';
      case 'dismissed':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'irrigation':
        return '💧';
      case 'fertilization':
        return '🌱';
      case 'pest_control':
        return '🐛';
      case 'harvest':
        return '🌾';
      default:
        return '📋';
    }
  };

  // Group recommendations by priority
  const groupedRecs = {
    urgent: recommendations.filter((r) => r.priority === 'urgent'),
    high: recommendations.filter((r) => r.priority === 'high'),
    medium: recommendations.filter((r) => r.priority === 'medium'),
    low: recommendations.filter((r) => r.priority === 'low'),
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Actions */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>
            {recommendations.length} Active Recommendation{recommendations.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.generateButtonSmall, generateRecs.isPending && styles.generateButtonDisabled]}
            onPress={handleGenerateRecommendations}
            disabled={generateRecs.isPending}
          >
            <Text style={styles.generateButtonSmallText}>
              {generateRecs.isPending ? '...' : '🔄 Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Urgent Recommendations */}
        {groupedRecs.urgent.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: getPriorityColor('urgent') }]}>
              🚨 URGENT ({groupedRecs.urgent.length})
            </Text>
            {groupedRecs.urgent.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onPress={() => openRecommendationDetail(rec)}
                getCategoryColor={getCategoryColor}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))}
          </View>
        )}

        {/* High Priority Recommendations */}
        {groupedRecs.high.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: getPriorityColor('high') }]}>
              ⚠️ HIGH PRIORITY ({groupedRecs.high.length})
            </Text>
            {groupedRecs.high.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onPress={() => openRecommendationDetail(rec)}
                getCategoryColor={getCategoryColor}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))}
          </View>
        )}

        {/* Medium Priority Recommendations */}
        {groupedRecs.medium.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: getPriorityColor('medium') }]}>
              📌 MEDIUM PRIORITY ({groupedRecs.medium.length})
            </Text>
            {groupedRecs.medium.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onPress={() => openRecommendationDetail(rec)}
                getCategoryColor={getCategoryColor}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))}
          </View>
        )}

        {/* Low Priority Recommendations */}
        {groupedRecs.low.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: getPriorityColor('low') }]}>
              ✅ LOW PRIORITY ({groupedRecs.low.length})
            </Text>
            {groupedRecs.low.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onPress={() => openRecommendationDetail(rec)}
                getCategoryColor={getCategoryColor}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {selectedRec && (
        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalCategory}>
                  {getCategoryIcon(selectedRec.category)} {selectedRec.category.replace('_', ' ').toUpperCase()}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>{selectedRec.title}</Text>

              {/* Badges */}
              <View style={styles.badgesContainer}>
                <View style={[styles.badge, { backgroundColor: getPriorityColor(selectedRec.priority) }]}>
                  <Text style={styles.badgeText}>{selectedRec.priority.toUpperCase()}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(selectedRec.status) }]}>
                  <Text style={styles.badgeText}>{selectedRec.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalText}>{selectedRec.description}</Text>
              </View>

              {/* Reasoning */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Why This Matters</Text>
                <Text style={styles.modalText}>{selectedRec.reasoning}</Text>
              </View>

              {/* Expected Impact */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Expected Impact</Text>
                <Text style={styles.modalText}>{selectedRec.expected_impact}</Text>
              </View>

              {/* Implementation Details */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Implementation</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timeframe:</Text>
                  <Text style={styles.detailValue}>{selectedRec.implementation_timeframe}</Text>
                </View>
                {selectedRec.estimated_cost && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Estimated Cost:</Text>
                    <Text style={styles.detailValue}>${selectedRec.estimated_cost.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Confidence:</Text>
                  <Text style={styles.detailValue}>{(selectedRec.confidence_score * 100).toFixed(0)}%</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {selectedRec.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                    onPress={() => handleStatusChange(selectedRec, 'in_progress')}
                  >
                    <Text style={styles.actionButtonText}>Start Working</Text>
                  </TouchableOpacity>
                )}
                {selectedRec.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                    onPress={() => handleStatusChange(selectedRec, 'completed')}
                  >
                    <Text style={styles.actionButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                  onPress={() => handleStatusChange(selectedRec, 'dismissed')}
                >
                  <Text style={styles.actionButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>

              {/* Date Info */}
              <Text style={styles.dateText}>
                Created: {new Date(selectedRec.recommendation_date).toLocaleDateString()}
              </Text>
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
  );
};

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: Recommendation;
  onPress: () => void;
  getCategoryColor: (category: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getCategoryIcon: (category: string) => string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onPress,
  getCategoryColor,
  getPriorityColor,
  getStatusColor,
  getCategoryIcon,
}) => {
  return (
    <TouchableOpacity
      style={[styles.recCard, { borderLeftColor: getPriorityColor(recommendation.priority) }]}
      onPress={onPress}
    >
      <View style={styles.recHeader}>
        <Text style={styles.recCategory}>
          {getCategoryIcon(recommendation.category)} {recommendation.category.replace('_', ' ')}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(recommendation.status) }]}>
          <Text style={styles.statusText}>{recommendation.status === 'in_progress' ? 'In Progress' : recommendation.status}</Text>
        </View>
      </View>
      <Text style={styles.recTitle}>{recommendation.title}</Text>
      <Text style={styles.recDescription} numberOfLines={2}>
        {recommendation.description}
      </Text>
      <View style={styles.recFooter}>
        <Text style={styles.recTimeframe}>⏱️ {recommendation.implementation_timeframe}</Text>
        <Text style={styles.recConfidence}>📊 {(recommendation.confidence_score * 100).toFixed(0)}%</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  generateButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButtonSmall: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  generateButtonSmallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  generateButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  recCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  recDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTimeframe: {
    fontSize: 12,
    color: '#6b7280',
  },
  recConfidence: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCategory: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 28,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButtons: {
    marginVertical: 24,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});
