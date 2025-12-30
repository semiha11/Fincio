import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => {
            onFinish();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* Custom Logo */}
                <View style={styles.logoContainer}>
                    <Svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <Circle cx="50" cy="50" r="45" fill={COLORS.accentGreen} fillOpacity="0.2" />
                        <Path
                            d="M30 65 L45 50 L55 60 L75 35"
                            stroke={COLORS.accentGreen}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <Path
                            d="M75 35 L75 45 M75 35 L65 35"
                            stroke={COLORS.accentGreen}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </View>

                <Text style={styles.title}>Fincio</Text>
                <Text style={styles.subtitle}>Finance Control</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 20,
        shadowColor: COLORS.accentGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 2,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        letterSpacing: 1,
        fontWeight: '500',
    },
});

export default SplashScreen;
