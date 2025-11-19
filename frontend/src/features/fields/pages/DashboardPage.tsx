import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useUiState } from '../../../shared/context/UiContext';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { YieldForecastSection } from '../../yield/components';
import { APIPerformanceCard } from '../components/APIPerformanceCard';
import { DisasterAssessmentSection } from '../components/DisasterAssessmentSection';
import { NDVICard } from '../components/NDVICard';
import { NDWICard } from '../components/NDWICard';
import { SystemUptimeCard } from '../components/SystemUptimeCard';
import { TDVICard } from '../components/TDVICard';
import { UserAnalyticsSection } from '../components/UserAnalyticsSection';
import { WeatherForecastSection } from '../components/WeatherForecastSection';
import { useDashboard } from '../hooks';

/**
 * DashboardPage
 *
 * Farmer landing page at /dashboard.
 * - Provides high-level overview cards (currently placeholder metrics)
 * - Exposes quick actions that navigate into field management flows
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentField } = useUiState();
  const { data: dashboardData, isLoading, error } = useDashboard();

  const handleAddField = () => {
    setCurrentField(undefined);
    navigate('/fields/create');
  };

  const handleOpenFieldsList = () => {
    navigate('/fields');
  };

  const handleViewWeather = () => {
    navigate('/weather');
  };

  const handleViewField = (fieldId: string) => {
    navigate(`/fields/${fieldId}`);
  };

  const getHealthStatusFromScore = (score: number): 'excellent' | 'fair' | 'poor' => {
    if (score >= 70) return 'excellent';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const formatActivityDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <section aria-labelledby="farmer-dashboard-heading" className="space-y-4">
        <header className="space-y-1">
          <h1 id="farmer-dashboard-heading" className="text-lg font-semibold text-gray-900">
            Farmer dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Loading your farm overview...
          </p>
        </header>
        <LoadingState message="Loading dashboard data..." />
      </section>
    );
  }

  if (error) {
    return (
      <section aria-labelledby="farmer-dashboard-heading" className="space-y-4">
        <header className="space-y-1">
          <h1 id="farmer-dashboard-heading" className="text-lg font-semibold text-gray-900">
            Farmer dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Overview of your fields and recent activity.
          </p>
        </header>
        <ErrorState
          title="Failed to load dashboard"
          message="Unable to load your farm data. Please try again."
        />
      </section>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    fields,
    health,
    alerts,
    recent_activity,
    field_thumbnails,
    vegetation_indices,
    system,
    weather_forecast,
    user_analytics,
    disaster_assessment
  } = dashboardData;

  return (
    <section aria-labelledby="farmer-dashboard-heading" className="space-y-6">
      <header className="space-y-1">
        <h1 id="farmer-dashboard-heading" className="text-lg font-semibold text-gray-900">
          Farmer dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Overview of your fields, recent health changes, and upcoming weather.
        </p>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Fields monitored" status="excellent" showStatusStripe>
          <p className="text-2xl font-semibold text-gray-900">{fields.total}</p>
          <p className="mt-1 text-xs text-gray-500">
            {fields.active} active • {fields.total_area_hectares.toFixed(1)} ha total
          </p>
        </Card>
        <Card
          title="Field health"
          status={getHealthStatusFromScore(health.average_score)}
          showStatusStripe
        >
          <p className="text-2xl font-semibold text-gray-900">{Math.round(health.average_score)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {health.status_distribution.good + health.status_distribution.moderate} healthy fields
          </p>
        </Card>
        <Card title="Active alerts" status="fair" showStatusStripe>
          <p className="text-2xl font-semibold text-gray-900">{alerts.total}</p>
          <p className="mt-1 text-xs text-gray-500">
            {alerts.by_severity.high} high priority • Last 7 days
          </p>
        </Card>
        <NDVICard ndvi={vegetation_indices.ndvi} totalRecords={vegetation_indices.total_records} />
        <NDWICard ndwi={vegetation_indices.ndwi} totalRecords={vegetation_indices.total_records} />
        <TDVICard tdvi={vegetation_indices.tdvi} totalRecords={vegetation_indices.total_records} />
        <SystemUptimeCard uptimeHours={system.uptime_hours} />
        <APIPerformanceCard avgResponseTimeMs={system.api_performance.avg_response_time_ms} />
        <Card title="Recommendations" status="excellent" showStatusStripe>
          <p className="text-2xl font-semibold text-gray-900">{alerts.total}</p>
          <p className="mt-1 text-xs text-gray-500">
            {alerts.by_type.water} water • {alerts.by_type.fertilizer} fertilizer
          </p>
        </Card>
      </div>

      {/* Field Thumbnails Grid */}
      {field_thumbnails.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-md font-semibold text-gray-900">Your Fields</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {field_thumbnails.map((field) => (
              <Card
                key={field.field_id}
                title={field.field_name}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewField(field.field_id)}
              >
                <div className="space-y-3">
                  {field.thumbnail_url ? (
                    <img
                      src={field.thumbnail_url}
                      alt={`Satellite view of ${field.field_name}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-600">
                    {field.area_hectares.toFixed(1)} hectares
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Weather Forecast */}
      {weather_forecast.available && (
        <WeatherForecastSection
          forecast={weather_forecast.forecast}
          totals={weather_forecast.totals}
        />
      )}

      {/* User Analytics */}
      <UserAnalyticsSection
        totalFields={user_analytics.total_fields}
        totalAssessments={user_analytics.total_assessments}
        avgHealthScore={user_analytics.avg_health_score}
        lastActivity={user_analytics.last_activity}
        activeUsersToday={user_analytics.active_users_today}
        sessionDurationAvg={user_analytics.session_duration_avg}
      />

      {/* Disaster Assessment */}
      <DisasterAssessmentSection
        assessments={disaster_assessment.assessments}
        available={disaster_assessment.available}
        highRiskCount={disaster_assessment.high_risk_count}
      />

      {/* Yield Forecast - Show for first field if available */}
      {field_thumbnails.length > 0 && (
        <YieldForecastSection
          request={{
            features: [{
              field_id: field_thumbnails[0].field_id,
              // Mock features - in real implementation, these would come from field data
              ndvi: 0.7,
              precipitation: 120,
              temperature: 25,
              soil_moisture: 0.6
            }]
          }}
          fieldArea={field_thumbnails[0].area_hectares}
        />
      )}

      {/* Recent Activity */}
      {recent_activity.length > 0 && (
        <Card title="Recent Activity">
          <div className="space-y-3">
            {recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'health_assessment' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.type === 'health_assessment'
                      ? `Health assessment: ${activity.details.status} (${activity.details.score})`
                      : `Recommendation: ${activity.details.type} (${activity.details.severity})`
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.field_name} • {formatActivityDate(activity.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={handleAddField}>
            Add new field
          </Button>
          <Button size="sm" variant="secondary" onClick={handleOpenFieldsList}>
            View all fields
          </Button>
          <Button size="sm" variant="ghost" onClick={handleViewWeather}>
            Check weather
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default DashboardPage;