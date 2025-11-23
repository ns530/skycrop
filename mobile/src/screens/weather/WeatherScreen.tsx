/**
 * WeatherScreen - Weather overview and forecasts
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';

import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

const WeatherScreen: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch weather data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Mock weather data
  const currentWeather = {
    temperature: 28,
    feelsLike: 32,
    condition: 'Partly Cloudy',
    humidity: 75,
    windSpeed: 12,
    rainfall: 0,
    uvIndex: 7,
  };

  const forecast = [
    { day: 'Mon', icon: 'partly-sunny', high: 30, low: 24, rain: 20 },
    { day: 'Tue', icon: 'rainy', high: 28, low: 23, rain: 80 },
    { day: 'Wed', icon: 'thunderstorm', high: 27, low: 22, rain: 90 },
    { day: 'Thu', icon: 'rainy', high: 29, low: 23, rain: 60 },
    { day: 'Fri', icon: 'partly-sunny', high: 31, low: 25, rain: 30 },
  ];

  const alerts = [
    {
      type: 'warning',
      title: 'Heavy Rain Expected',
      message: 'Rainfall expected Tuesday - Wednesday. Delay irrigation.',
      icon: 'warning',
      color: '#f59e0b',
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading weather..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Current Weather */}
        <View style={styles.currentWeather}>
          <View style={styles.currentHeader}>
            <Icon name="location" size={16} color="#fff" />
            <Text style={styles.location}>Your Fields Area</Text>
          </View>
          
          <View style={styles.temperatureContainer}>
            <Icon name="partly-sunny" size={80} color="#fff" />
            <View style={styles.temperatureContent}>
              <Text style={styles.temperature}>{currentWeather.temperature}°C</Text>
              <Text style={styles.condition}>{currentWeather.condition}</Text>
              <Text style={styles.feelsLike}>
                Feels like {currentWeather.feelsLike}°C
              </Text>
            </View>
          </View>

          <View style={styles.currentDetails}>
            <WeatherDetail
              icon="water"
              label="Humidity"
              value={`${currentWeather.humidity}%`}
              light
            />
            <WeatherDetail
              icon="speedometer"
              label="Wind"
              value={`${currentWeather.windSpeed} km/h`}
              light
            />
            <WeatherDetail
              icon="rainy"
              label="Rainfall"
              value={`${currentWeather.rainfall} mm`}
              light
            />
          </View>
        </View>

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weather Alerts</Text>
            {alerts.map((alert, index) => (
              <View
                key={index}
                style={[styles.alert, { borderLeftColor: alert.color }]}
              >
                <Icon name={alert.icon} size={24} color={alert.color} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 5-Day Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <View style={styles.forecastGrid}>
            {forecast.map((day, index) => (
              <View key={index} style={styles.forecastCard}>
                <Text style={styles.forecastDay}>{day.day}</Text>
                <Icon name={day.icon} size={32} color="#2563eb" />
                <Text style={styles.forecastHigh}>{day.high}°</Text>
                <Text style={styles.forecastLow}>{day.low}°</Text>
                <View style={styles.rainChance}>
                  <Icon name="water" size={12} color="#3b82f6" />
                  <Text style={styles.rainText}>{day.rain}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <View style={styles.detailsGrid}>
            <DetailCard
              icon="sunny"
              label="UV Index"
              value={currentWeather.uvIndex.toString()}
              description="High - Use protection"
              color="#f59e0b"
            />
            <DetailCard
              icon="eye"
              label="Visibility"
              value="10 km"
              description="Good visibility"
              color="#3b82f6"
            />
            <DetailCard
              icon="water"
              label="Dew Point"
              value="23°C"
              description="Comfortable"
              color="#10b981"
            />
            <DetailCard
              icon="trending-up"
              label="Pressure"
              value="1013 hPa"
              description="Normal"
              color="#6b7280"
            />
          </View>
        </View>

        {/* Farming Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farming Insights</Text>
          
          <InsightCard
            icon="checkmark-circle"
            iconColor="#10b981"
            title="Good for Irrigation"
            description="Current conditions are ideal for irrigation activities."
          />
          <InsightCard
            icon="warning"
            iconColor="#f59e0b"
            title="Avoid Pesticide Application"
            description="High winds and upcoming rain. Delay pesticide spraying."
          />
          <InsightCard
            icon="leaf"
            iconColor="#3b82f6"
            title="Monitor Field Drainage"
            description="Heavy rain expected. Ensure proper field drainage."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const WeatherDetail: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
  light?: boolean;
}> = ({ icon, label, value, light }) => (
  <View style={styles.weatherDetail}>
    <Icon name={icon} size={20} color={light ? '#fff' : '#6b7280'} />
    <Text style={[styles.weatherDetailLabel, light && styles.textLight]}>
      {label}
    </Text>
    <Text style={[styles.weatherDetailValue, light && styles.textLight]}>
      {value}
    </Text>
  </View>
);

const DetailCard: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
  description: string;
  color: string;
}> = ({ icon, label, value, description, color }) => (
  <View style={styles.detailCard}>
    <View style={[styles.detailIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
    <Text style={styles.detailDescription}>{description}</Text>
  </View>
);

const InsightCard: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  iconColor: string;
  title: string;
  description: string;
}> = ({ icon, iconColor, title, description }) => (
  <View style={styles.insightCard}>
    <View style={[styles.insightIcon, { backgroundColor: iconColor + '20' }]}>
      <Icon name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.insightContent}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingBottom: 16,
  },
  currentWeather: {
    backgroundColor: '#2563eb',
    padding: 24,
    marginBottom: 16,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  location: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  temperatureContent: {
    flex: 1,
  },
  temperature: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 64,
  },
  condition: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  currentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherDetail: {
    alignItems: 'center',
    gap: 4,
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  weatherDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  textLight: {
    color: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  alert: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  forecastGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  forecastCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  forecastHigh: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  forecastLow: {
    fontSize: 14,
    color: '#6b7280',
  },
  rainChance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rainText: {
    fontSize: 12,
    color: '#3b82f6',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  detailDescription: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default WeatherScreen;


