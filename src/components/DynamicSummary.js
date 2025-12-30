import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';
import { DataContext } from '../context/DataContext';

const DynamicSummary = () => {
    const [activeTab, setActiveTab] = useState('investments'); // 'investments' or 'income'
    const { totalIncome, totalExpenses, savingsPotential, regularIncome, irregularIncome, theme, formatCurrency, financialData } = useContext(DataContext);

    // Calculate Income Distribution
    const allIncome = [...regularIncome, ...irregularIncome];
    const activeIncomeTotal = allIncome.filter(i => i.incomeType === 'Aktif Gelir' || !i.incomeType).reduce((sum, i) => sum + Number(i.amount), 0);
    const passiveIncomeTotal = allIncome.filter(i => i.incomeType === 'Pasif Gelir').reduce((sum, i) => sum + Number(i.amount), 0);
    const sideIncomeTotal = allIncome.filter(i => i.incomeType === 'Ek Gelir').reduce((sum, i) => sum + Number(i.amount), 0);

    const totalCalculated = activeIncomeTotal + passiveIncomeTotal + sideIncomeTotal;
    const isPositive = savingsPotential > 0;
    const hasInvestments = financialData.assets > 0;
    const hasIncome = totalIncome > 0;

    const renderInvestments = () => (
        <View style={styles.contentContainer}>
            <View style={styles.row}>
                <View>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Getiri</Text>
                    <Text style={[styles.value, { color: theme.textPrimary }]}>{formatCurrency(financialData.assets)}</Text>
                    {hasInvestments && <Text style={styles.subValue}>%--</Text>}
                </View>
                <View style={styles.chartBox}>
                    {hasInvestments ? (
                        <Svg height="40" width="80">
                            <Path d="M0 30 L20 25 L40 35 L60 10 L80 5" fill="none" stroke={theme.accent} strokeWidth="2" />
                        </Svg>
                    ) : (
                        <Text style={{ fontSize: 24 }}>📉</Text>
                    )}
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 14 }}>{hasInvestments ? '🚀' : 'ℹ️'}</Text>
                <Text style={[styles.aiText, { color: theme.textSecondary, marginLeft: 6 }]}>
                    {hasInvestments ? 'Aktif' : 'Yatırım Yok'}
                </Text>
            </View>
        </View>
    );

    const renderIncome = () => (
        <View style={styles.contentContainer}>
            <View style={styles.row}>
                <View>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Analiz</Text>
                    <Text style={[styles.value, { color: theme.textPrimary }]}>{formatCurrency(totalIncome)}</Text>
                    <Text style={[styles.subValue, { color: theme.accent, fontSize: 12 }]}>
                        {hasIncome ? `Gider: ${formatCurrency(totalExpenses)}` : 'Veri Yok'}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 14 }}>{isPositive ? '💡' : '⚠️'}</Text>
                <Text style={[styles.aiText, { color: isPositive ? theme.textSecondary : COLORS.accentRed, marginLeft: 6 }]}>
                    {hasIncome
                        ? (isPositive ? `Potansiyel: ${formatCurrency(savingsPotential)}` : 'Limit Aşıldı')
                        : 'Gelir Ekle'}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.tabContainer, { backgroundColor: theme.glassBorder }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'investments' && { backgroundColor: theme.glassBorder }]}
                    onPress={() => setActiveTab('investments')}
                >
                    <Text style={[styles.tabText, activeTab === 'investments' ? { color: theme.textPrimary } : { color: theme.textSecondary }]}>Yatırımlar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'income' && { backgroundColor: theme.glassBorder }]}
                    onPress={() => setActiveTab('income')}
                >
                    <Text style={[styles.tabText, activeTab === 'income' ? { color: theme.textPrimary } : { color: theme.textSecondary }]}>Gelirler</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'investments' ? renderInvestments() : renderIncome()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        padding: SIZES.padding,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: '500',
        fontSize: 13,
    },
    activeTabText: {
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    contentContainer: {
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    subValue: {
        color: COLORS.accentGreen,
        fontSize: 14,
        fontWeight: '600',
    },
    chartBox: {
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: '100%',
        gap: 5,
    },
    bar: {
        width: 10,
        borderRadius: 2,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
        marginTop: 5,
    },
    badgeText: {
        color: COLORS.accentGreen,
        fontSize: 11,
        fontWeight: '600',
    },
    aiText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 5,
    },
});

export default DynamicSummary;
