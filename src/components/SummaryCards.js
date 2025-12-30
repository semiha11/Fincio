import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';
import { DataContext } from '../context/DataContext';

const SummaryCards = () => {
    const { formatCurrency, theme } = useContext(DataContext);
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Özet Durum</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Card A: Investments */}
                <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>📈</Text>
                        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Yatırımlar</Text>
                    </View>
                    <View style={styles.cardMain}>
                        <Text style={[styles.cardValue, { color: theme.accent }]}>+{formatCurrency(1250)}</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Günlük Getiri</Text>
                    </View>
                    <View style={styles.cardVisual}>
                        <Svg height="30" width="100" viewBox="0 0 100 30">
                            <Path
                                d="M0,25 C10,25 20,10 30,15 C40,20 50,5 60,10 C70,15 80,0 90,5 L100,0"
                                fill="none"
                                stroke={theme.accent}
                                strokeWidth="2"
                            />
                        </Svg>
                        <Text style={[styles.visualLabel, { color: theme.textSecondary }]}>Son 7 Gün</Text>
                    </View>
                </View>

                {/* Card B: Income */}
                <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>💸</Text>
                        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Gelirler</Text>
                    </View>
                    <View style={styles.cardMain}>
                        <Text style={[styles.cardValue, { color: theme.textPrimary }]}>{formatCurrency(45000)}</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Beklenen</Text>
                    </View>
                    <View style={[styles.infoBox, { marginTop: 'auto' }]}>
                        <Text style={[styles.infoHighlight, { color: COLORS.accentYellow }]}>4 gün</Text>
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>sonra Maaş</Text>
                    </View>
                </View>

                {/* Card C: Payments */}
                <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>🧾</Text>
                        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Ödemeler</Text>
                    </View>
                    <View style={styles.cardMain}>
                        <Text style={[styles.cardValue, { color: theme.textPrimary }]}>{formatCurrency(12450)}</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Bu Ay</Text>
                    </View>
                    <View style={[styles.infoBox, { marginTop: 'auto' }]}>
                        <Text style={styles.categoryIcon}>🍽️</Text>
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>En çok: Restoran</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 10,
        marginLeft: 5,
    },
    scrollContent: {
        gap: 15,
        paddingRight: 20,
    },
    card: {
        width: 160,
        height: 180,
        padding: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        overflow: 'hidden',
        justifyContent: 'space-between'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardIcon: {
        fontSize: 18,
    },
    cardTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    cardMain: {
        marginVertical: 10,
    },
    cardValue: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    cardSub: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    cardVisual: {
        marginTop: 'auto',
    },
    visualLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
        marginTop: 4,
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoHighlight: {
        color: COLORS.accentYellow,
        fontWeight: '600',
        fontSize: 12,
    },
    infoText: {
        color: COLORS.textSecondary,
        fontSize: 11,
    },
    categoryIcon: {
        fontSize: 14,
    },
});

export default SummaryCards;
