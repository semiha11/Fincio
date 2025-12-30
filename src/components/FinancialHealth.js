import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../constants/theme';

import { DataContext } from '../context/DataContext';

import OnboardingTooltip from './OnboardingTooltip';

const FinancialHealth = () => {
    const { theme, formatCurrency, totalBudgetLimit, totalIncome, totalExpenses, financialData, onboardingStep, fincioScore } = useContext(DataContext);

    // Local state for modal
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editValues, setEditValues] = React.useState({ assets: '', debts: '' });

    // Constants from DataContext
    const investments = financialData.assets;
    const debts = financialData.debts;
    const netWorth = investments - debts;

    const freeCashFlow = totalIncome - totalExpenses;
    const budgetPercentage = totalBudgetLimit > 0 ? (totalExpenses / totalBudgetLimit) * 100 : 0;

    // Mock comparison data
    const comparisonText = "Geçen aya göre %5 daha az harcadınız.";
    const isBetter = true; // true if better than last month

    let progressColor = COLORS.accentGreen;
    if (budgetPercentage > 80) progressColor = COLORS.accentYellow;
    if (budgetPercentage > 100) progressColor = COLORS.accentRed;

    // Calculate bar heights for visualization (max height 60px)
    const maxVal = Math.max(investments, debts, 1); // Avoid div by zero
    const assetHeight = (investments / maxVal) * 60;
    const debtHeight = (debts / maxVal) * 60;



    const isTooltipActive = onboardingStep === 1 || onboardingStep === 2;
    const hasAnyData = totalIncome > 0 || totalExpenses > 0 || investments > 0 || debts > 0;

    if (!hasAnyData) {
        return (
            <View style={[styles.container, { borderColor: theme.glassBorder }]}>
                <View style={[styles.card, { backgroundColor: 'transparent', alignItems: 'center', paddingVertical: 30 }]}>
                    <View style={[StyleSheet.absoluteFill, { borderRadius: SIZES.borderRadius, overflow: 'hidden' }]}>
                        <BlurView intensity={20} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: theme.cardBg }]} />
                    </View>
                    <Text style={{ fontSize: 40, marginBottom: 10 }}>👋</Text>
                    <Text style={[styles.title, { color: theme.textPrimary, fontWeight: 'bold', marginBottom: 5 }]}>Fincio'ya Hoş Geldin!</Text>
                    <Text style={[styles.label, { color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 20 }]}>
                        Henüz bir finansal veri bulunmuyor. Başlamak için aşağıdaki <Text style={{ fontWeight: 'bold', color: COLORS.accentGreen }}>(+)</Text> butonuna dokunarak gelir veya varlık ekleyebilirsin.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { borderColor: theme.glassBorder, zIndex: isTooltipActive ? 9999 : 1 }]}>
            <View style={[styles.card, { backgroundColor: 'transparent' }]}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: SIZES.borderRadius, overflow: 'hidden' }]}>
                    <BlurView intensity={20} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: theme.cardBg }]} />
                </View>

                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.title, { color: theme.textSecondary }]}>Genel Finansal Sağlık</Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: theme.glassBorder }]}>
                        <Text style={[styles.scoreTitle, { color: theme.textSecondary }]}>Fincio Skoru</Text>
                        <Text style={styles.scoreValue}>{fincioScore === 0 ? 'Hesaplanıyor' : fincioScore}</Text>
                    </View>
                </View>

                <OnboardingTooltip
                    step={1}
                    content={`Bu, tüm varlıklarınız ₺ ve borçlarınız ₺ arasındaki farktır. Finansal sağlığınızın anlık durumudur.`}
                    placement="bottom"
                >
                    <View style={styles.netWorthSection}>
                        <View style={styles.netWorthInfo}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Net Servet</Text>
                            <Text style={[styles.netWorthValue, { color: theme.textPrimary }]}>{formatCurrency(netWorth)}</Text>
                        </View>

                        <View style={styles.visualBars}>
                            <View style={styles.barGroup}>
                                <View style={[styles.bar, { height: Math.max(assetHeight, 4), backgroundColor: COLORS.accentGreen }]} />
                                <Text style={styles.barLabel}>Varlık</Text>
                                <Text style={[styles.barValue, { color: COLORS.accentGreen }]}>{formatCurrency(investments)}</Text>
                            </View>
                            <View style={styles.barGroup}>
                                <View style={[styles.bar, { height: Math.max(debtHeight, 4), backgroundColor: COLORS.accentRed }]} />
                                <Text style={styles.barLabel}>Borç</Text>
                                <Text style={[styles.barValue, { color: COLORS.accentRed }]}>{formatCurrency(debts)}</Text>
                            </View>
                        </View>
                    </View>
                </OnboardingTooltip>

                {/* Modal for Editing */}


                <OnboardingTooltip
                    step={2}
                    content={`Belirlenen bütçe limitinizi ₺ aştıktan sonra elinizde kalan, harcayabileceğiniz ya da tasarruf edebileceğiniz tutardır.`}
                    placement="top"
                >
                    <View style={styles.budgetContainer}>
                        <View style={styles.budgetHeader}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Aylık Serbest Nakit Akışı</Text>
                            <Text style={[styles.budgetValue, { color: theme.textPrimary }]}>{formatCurrency(freeCashFlow)}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text style={[styles.metaText, { color: theme.textSecondary }]}>Belirlenen Bütçe Limiti: {formatCurrency(totalBudgetLimit)}</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.glassBorder }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${Math.min(budgetPercentage, 100)}%`, backgroundColor: progressColor }
                                ]}
                            />
                        </View>
                        <View style={styles.budgetMeta}>
                            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{formatCurrency(totalExpenses)} harcandı</Text>
                            <Text style={[styles.metaText, { color: theme.textSecondary }]}>%{Math.round(budgetPercentage)} kullanıldı</Text>
                        </View>
                        <Text style={[styles.comparisonText, { color: isBetter ? COLORS.accentGreen : COLORS.accentRed }]}>
                            {comparisonText} {isBetter ? '🟢' : '🔴'}
                        </Text>
                    </View>
                </OnboardingTooltip>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        borderRadius: SIZES.borderRadius,
        // overflow: 'hidden', // Removed to allow tooltip overflow
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    card: {
        borderRadius: SIZES.borderRadius, // Moved radius here
        padding: SIZES.padding,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        overflow: 'visible', // Ensure tooltip isn't clipped
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
        gap: 6,
    },
    scoreTitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    scoreValue: {
        color: COLORS.accentYellow,
        fontSize: 14,
        fontWeight: '700',
    },
    netWorthSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    netWorthInfo: {
        justifyContent: 'center',
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 5,
    },
    netWorthValue: {
        color: COLORS.textPrimary,
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -1,
    },
    visualBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 15,
    },
    barGroup: {
        alignItems: 'center',
    },
    bar: {
        width: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    barLabel: {
        fontSize: 10,
        color: COLORS.textSecondary
    },
    barValue: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    budgetContainer: {
        gap: 8,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    budgetValue: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    budgetMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    comparisonText: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        alignItems: 'center',
    },
    modalCard: {
        width: '85%',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 5,
        marginLeft: 5,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        fontSize: 16,
    },
});

export default FinancialHealth;
