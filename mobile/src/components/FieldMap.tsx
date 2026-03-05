/**
 * FieldMap Component - Safe Platform Export
 * 
 * Wraps the native FieldMap component with error handling
 * to prevent crashes in Expo Go where react-native-maps
 * may not be available.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';

interface FieldMapProps {
    initialRegion?: any;
    boundary?: any;
    center?: { latitude: number; longitude: number };
    editable?: boolean;
    onBoundaryChange?: (boundary: any) => void;
    height?: number;
}

// Try to import native map, fall back to placeholder if unavailable
let NativeFieldMap: React.FC<FieldMapProps> | null = null;
try {
    // This will fail in Expo Go if react-native-maps isn't available
    NativeFieldMap = require('./FieldMap.native').FieldMap;
} catch (e) {
    console.warn('[FieldMap] react-native-maps not available, using placeholder');
}

export const FieldMap: React.FC<FieldMapProps> = (props) => {
    if (NativeFieldMap) {
        try {
            return <NativeFieldMap {...props} />;
        } catch (e) {
            // Fall through to placeholder
        }
    }

    const { height = 300, center, editable } = props;

    return (
        <View style={[styles.placeholder, { height }]}>
            <Icon name="map-outline" size={48} color="#9ca3af" />
            <Text style={styles.placeholderTitle}>Map View</Text>
            {center ? (
                <Text style={styles.placeholderText}>
                    📍 {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
                </Text>
            ) : (
                <Text style={styles.placeholderText}>
                    Map requires a development build.{'\n'}
                    Use Expo Dev Build to enable maps.
                </Text>
            )}
            {editable && (
                <Text style={styles.placeholderHint}>
                    Enter coordinates manually below
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    placeholder: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
        padding: 16,
    },
    placeholderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 8,
    },
    placeholderText: {
        fontSize: 13,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 18,
    },
    placeholderHint: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 8,
        fontStyle: 'italic',
    },
});
