import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import EditModal from '../components/EditModal';
import CustomAlert from '../components/CustomAlert';
import { DataContext } from '../context/DataContext';

import OnboardingTooltip from '../components/OnboardingTooltip';

const IncomeScreen = ({ scrollViewRef }) => {
    const {
        regularIncome,
        irregularIncome,
        budgets,
        goals,
        payYourselfRule,
        totalIncome,
        savingsPotential,
        addIncome,
        updateIncome,
        deleteIncome,
        updateBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        updateRule,
        formatCurrency,
        theme,
        getDaysRemaining,
        totalBudgetLimit,
        userSettings,
        updateBudgetLimitPercentage,
        updateBudgetLimitAmount,
        setCurrentScreen,
        setOnboardingStep
    } = useContext(DataContext);



    const isPositive = savingsPotential > 0;

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
    const [editConfig, setEditConfig] = useState({ title: '', fields: [], onSave: () => { }, onDelete: null });
    const [editingItem, setEditingItem] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Handlers
    const handleDelete = (item, type) => {
        Alert.alert(
            "Gelir Kaynağını Sil",
            `"${item.name}" kaynağını silmek istediğinizden emin misiniz? Tüm geçmiş verileri silinecektir.`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: () => deleteIncome(item.id, type)
                }
            ]
        );
    };

    const openEditModal = (item, type, incomeCategory = 'regular') => {
        if (isEditMode && type === 'income' && item) return; // Prevent editing while in delete/reorder mode

        setEditingItem(item);
        let config = {};

        if (type === 'income') {
            const isRegular = incomeCategory === 'regular' || (item && item.type === 'regular');

            config = {
                title: item ? 'Gelir Düzenle' : (isRegular ? 'Yeni Düzenli Gelir Ekle' : 'Yeni Düzensiz Gelir Ekle'),
                fields: [
                    { key: 'name', label: 'Gelir Adı', placeholder: 'Örn: ' + (isRegular ? 'Maaş' : 'Freelance') },
                    { key: 'amount', label: 'Tutar (₺)', placeholder: '0', keyboardType: 'numeric' },
                    ...(isRegular ? [{
                        key: 'frequency',
                        label: 'Tekrarlama Sıklığı',
                        type: 'select',
                        options: ['Aylık', '2 Haftada Bir', 'Üç Aylık', 'Yıllık']
                    }] : []),
                    { key: 'date', label: isRegular ? 'Sonraki Ödeme Tarihi' : 'Gelir Tarihi', placeholder: isRegular ? 'Örn: Her ayın 15\'i' : 'Örn: Bugün' },
                    {
                        key: 'incomeType',
                        label: 'Gelir Tipi',
                        type: 'select',
                        options: ['Aktif Gelir', 'Pasif Gelir', 'Ek Gelir']
                    },
                ],
                onSave: (data) => {
                    const newItem = {
                        ...item,
                        ...data,
                        amount: Number(data.amount),
                        frequency: data.frequency || (isRegular ? 'Aylık' : 'Tek Seferlik'),
                        incomeType: data.incomeType || 'Aktif Gelir',
                        type: isRegular ? 'regular' : 'irregular'
                    };
                    if (item) {
                        updateIncome(newItem);
                    } else {
                        addIncome(newItem, isRegular ? 'regular' : 'irregular');
                    }
                }
            };
        } else if (type === 'budget') {
            config = {
                title: 'Bütçe Limiti Düzenle',
                fields: [
                    { key: 'limit', label: 'Aylık Limit (₺)', placeholder: '0', keyboardType: 'numeric' },
                ],
                onSave: (data) => {
                    updateBudget({ ...item, limit: Number(data.limit) });
                }
            };
        } else if (type === 'goal') {
            config = {
                title: item ? 'Hedef Düzenle' : 'Yeni Hedef Ekle',
                fields: [
                    { key: 'name', label: 'Hedef Adı', placeholder: 'Örn: Araba' },
                    { key: 'target', label: 'Hedef Tutar (₺)', placeholder: '0', keyboardType: 'numeric' },
                    { key: 'saved', label: 'Biriken (₺)', placeholder: '0', keyboardType: 'numeric' },
                ],
                onSave: (data) => {
                    const newItem = {
                        ...item,
                        ...data,
                        saved: Number(data.saved),
                        target: Number(data.target)
                    };
                    if (item) {
                        updateGoal(newItem);
                    } else {
                        addGoal(newItem);
                    }
                },
                onDelete: item ? () => {
                    Alert.alert(
                        'Hedefi Sil',
                        `"${item.name}" hedefini silmek istediğinizden emin misiniz?`,
                        [
                            { text: 'Vazgeç', style: 'cancel' },
                            {
                                text: 'Sil',
                                style: 'destructive',
                                onPress: () => {
                                    deleteGoal(item.id);
                                    setModalVisible(false);
                                }
                            }
                        ]
                    );
                } : undefined
            };
        } else if (type === 'rule') {
            config = {
                title: 'Kural Düzenle',
                fields: [
                    { key: 'percent', label: 'Tasarruf Oranı (%)', placeholder: '10', keyboardType: 'numeric' },
                ],
                onSave: (data) => {
                    const newPercent = Number(data.percent);
                    const newAmount = (totalIncome * newPercent) / 100;
                    updateRule({ ...payYourselfRule, percent: newPercent, amount: newAmount });
                }
            };
        } else if (type === 'budget_limit') {
            config = {
                title: 'Genel Bütçe Limiti',
                fields: [
                    { key: 'amount', label: 'Aylık Limit Tutarı (₺)', placeholder: '0', keyboardType: 'numeric' },
                ],
                onSave: (data) => {
                    const newAmount = Number(data.amount);
                    updateBudgetLimitAmount(newAmount);
                }
            };
        }

        setEditConfig(config);
        setModalVisible(true);
    };

    const handleAddNewIncome = () => {
        setAlertConfig({
            title: 'Gelir Ekle',
            message: 'Hangi tür gelir eklemek istersiniz?',
            buttons: [
                {
                    text: 'Düzenli Gelir (Maaş vb.)',
                    onPress: () => {
                        setAlertVisible(false);
                        openEditModal(null, 'income', 'regular');
                    }
                },
                {
                    text: 'Düzensiz Gelir (Ek Gelir)',
                    onPress: () => {
                        setAlertVisible(false);
                        openEditModal(null, 'income', 'irregular');
                    }
                },
                { text: 'Vazgeç', style: 'cancel', onPress: () => setAlertVisible(false) }
            ]
        });
        setAlertVisible(true);
    };

    const renderCashFlow = () => (
        <OnboardingTooltip
            step={4}
            content="Burası sizin Bütçe Yönetim Merkeziniz. Gelirlerinizi ekleyip planlayabilirsiniz."
            placement="bottom"
            onNextOverride={() => {
                setOnboardingStep(5);
                setCurrentScreen('Payments');
            }}
        >
            <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Nakit Akışı Özeti</Text>
                <View style={styles.cashFlowCard}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Toplam Net Gelir</Text>
                            <Text style={[styles.totalValue, { color: theme.textPrimary }]}>{formatCurrency(totalIncome)}</Text>
                            <Text style={styles.changeText}>Geçen aya göre +%5 ▲</Text>
                        </View>
                        <View style={styles.savingsBox}>
                            <Text style={[styles.savingsLabel, { color: theme.textSecondary }]}>Tasarruf Potansiyeli</Text>
                            <Text style={[styles.savingsValue, { color: isPositive ? COLORS.accentGreen : COLORS.accentRed }]}>
                                {isPositive ? '+' : ''}{formatCurrency(savingsPotential)}
                            </Text>
                        </View>
                    </View>

                    {/* Distribution Pie Mock */}
                    <View style={styles.chartRow}>
                        <Svg height="100" width="100" viewBox="0 0 100 100">
                            <Circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                            <Circle cx="50" cy="50" r="40" stroke={COLORS.accentBlue} strokeWidth="10" fill="none" strokeDasharray="180 251" strokeLinecap="round" rotation="-90" origin="50, 50" />
                            <Circle cx="50" cy="50" r="40" stroke={COLORS.accentYellow} strokeWidth="10" fill="none" strokeDasharray="50 251" strokeDashoffset="-180" strokeLinecap="round" rotation="-90" origin="50, 50" />
                        </Svg>
                        <View style={styles.legendContainer}>
                            <Text style={[styles.legendItem, { color: COLORS.accentBlue }]}>🔵 Maaş (%75)</Text>
                            <Text style={[styles.legendItem, { color: COLORS.accentYellow }]}>🟡 Kira (%15)</Text>
                            <Text style={[styles.legendItem, { color: COLORS.textSecondary }]}>⚪ Diğer (%10)</Text>
                        </View>
                    </View>
                    <Text style={styles.aiScore}>⚠️ Çeşitlilik Skoru: Düşük (3/10)</Text>
                </View>
            </View>
        </OnboardingTooltip>
    );

    const renderIncomeItem = (item, type) => {
        let dateDisplay = item.date;
        if (type === 'regular') {
            // Try to extract day number if it's a string like "Her ayın 15'i" or just use it if it's a number
            const dayMatch = item.date ? item.date.toString().match(/(\d+)/) : null;
            if (dayMatch) {
                const day = parseInt(dayMatch[0]);
                if (day > 0 && day <= 31) {
                    const daysLeft = getDaysRemaining(day);
                    dateDisplay = `${daysLeft} gün kaldı`;
                }
            }
        }

        return (
            <TouchableOpacity
                key={item.id}
                onPress={() => openEditModal(item, 'income', type)}
                disabled={isEditMode}
                style={{ marginBottom: 10 }}
            >
                <BlurView intensity={isEditMode ? 5 : 20} tint="dark" style={[styles.incomeCard, isEditMode && styles.incomeCardEditing]}>
                    <View style={styles.incomeRow}>
                        {isEditMode && (
                            <TouchableOpacity onPress={() => handleDelete(item, type)} style={styles.deleteButton}>
                                <Text style={styles.deleteIcon}>⊖</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.incomeContent}>
                            <View style={styles.incomeHeader}>
                                <Text style={[styles.incomeName, { color: theme.textPrimary }]}>{item.name}</Text>
                                <Text style={[styles.incomeAmount, { color: theme.textPrimary }]}>{formatCurrency(item.amount)}</Text>
                            </View>
                            <Text style={[styles.incomeDate, { color: theme.textSecondary }]}>{type === 'regular' ? '⏳' : '📅'} {dateDisplay}</Text>
                        </View>

                        {isEditMode && (
                            <View style={styles.dragHandle}>
                                <Text style={styles.dragIcon}>☰</Text>
                            </View>
                        )}
                    </View>
                </BlurView>
            </TouchableOpacity>
        );
    };

    const renderIncomeSources = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.headerRow}>
                <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>Gelir Kaynakları</Text>
                <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)} style={styles.editButton}>
                    <Text style={[styles.editButtonText, { color: theme.accent }]}>{isEditMode ? 'Bitti' : '✏️ Düzenle'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.subHeader, { color: theme.textPrimary }]}>Düzenli Gelirler</Text>
            {regularIncome.map(item => renderIncomeItem(item, 'regular'))}


            <Text style={[styles.subHeader, { marginTop: 15, color: theme.textPrimary }]}>Düzensiz Gelirler</Text>
            {irregularIncome.map(item => renderIncomeItem(item, 'irregular'))}

            {isEditMode && (
                <TouchableOpacity style={[styles.addNewButton, { backgroundColor: theme.accent }]} onPress={handleAddNewIncome}>
                    <Text style={styles.addNewButtonText}>➕ Yeni Ekle</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderBudgetsAndGoals = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.headerTitle}>Bütçe ve Hedefler</Text>

            {/* Category Budgets */}
            <View style={styles.cardGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <Text style={[styles.groupTitle, { marginBottom: 0 }]}>Kategori Bütçeleri</Text>
                    <TouchableOpacity onPress={() => openEditModal({ amount: userSettings.budgetLimitAmount || totalBudgetLimit }, 'budget_limit')}>
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>
                            Aylık Genel Limit: {formatCurrency(totalBudgetLimit)}
                        </Text>
                    </TouchableOpacity>
                </View>
                {budgets.map(budget => (
                    <TouchableOpacity key={budget.id} onPress={() => openEditModal(budget, 'budget')}>
                        <View style={styles.budgetRow}>
                            <View style={styles.budgetInfo}>
                                <Text style={styles.budgetName}>{budget.name}</Text>
                                <Text style={styles.budgetValues}>{formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%`, backgroundColor: budget.color }
                                    ]}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Savings Goals */}
            <View style={styles.cardGroup}>
                <Text style={styles.groupTitle}>Tasarruf Hedefleri</Text>
                {goals.map(goal => {
                    const monthsLeft = (goal.target - goal.saved) / (savingsPotential > 0 ? savingsPotential : 1);
                    const estimatedDate = new Date();
                    estimatedDate.setMonth(estimatedDate.getMonth() + monthsLeft);
                    const dateStr = estimatedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

                    return (
                        <TouchableOpacity key={goal.id} onPress={() => openEditModal(goal, 'goal')}>
                            <View style={styles.goalRow}>
                                <View style={styles.goalInfo}>
                                    <Text style={styles.goalName}>{goal.name}</Text>
                                    <Text style={styles.goalValues}>%{(goal.saved / goal.target * 100).toFixed(0)}</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={[goal.color, COLORS.accentBlue]}
                                        style={[styles.progressBarFill, { width: `${Math.min((goal.saved / goal.target) * 100, 100)}%` }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    />
                                </View>
                                <Text style={styles.goalRemaining}>
                                    Hedefe ulaşmak için {monthsLeft > 0 ? monthsLeft.toFixed(1) : 0} ay kaldı. (Tahmini: {dateStr})
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <TouchableOpacity style={styles.addButton} onPress={() => openEditModal(null, 'goal')}>
                    <Text style={styles.addButtonText}>+ Yeni Hedef Ekle</Text>
                </TouchableOpacity>
            </View>

            {/* Pay Yourself First */}
            <TouchableOpacity onPress={() => openEditModal(payYourselfRule, 'rule')}>
                <LinearGradient
                    colors={['rgba(16, 185, 129, 0.2)', 'rgba(30, 41, 59, 0.8)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payYourselfCard}
                >
                    <Text style={styles.payTitle}>💡 Önce Kendine Öde</Text>
                    <Text style={styles.payDesc}>Maaşının %{payYourselfRule.percent}'unu ({formatCurrency(payYourselfRule.amount)}) otomatik olarak Tasarruf Hedefi'ne aktarmayı öneriyoruz.</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderCashFlow()}
                {renderIncomeSources()}
                {renderBudgetsAndGoals()}
                <View style={{ height: 100 }} />
            </ScrollView>

            <EditModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editConfig.title}
                fields={editConfig.fields}
                onSave={editConfig.onSave}
                onDelete={editConfig.onDelete}
                initialData={editingItem}
            />
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 10,
    },
    summaryContainer: {
        marginBottom: 20,
    },
    cashFlowCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    totalValue: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
    },
    changeText: {
        color: COLORS.accentGreen,
        fontSize: 12,
        marginTop: 4,
    },
    savingsBox: {
        alignItems: 'flex-end',
    },
    savingsLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    savingsValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    legendContainer: {
        gap: 8,
    },
    legendItem: {
        fontSize: 12,
        fontWeight: '500',
    },
    aiScore: {
        color: COLORS.accentYellow,
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    sectionContainer: {
        marginBottom: 25,
    },
    headerTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 15,
        marginLeft: 5,
    },
    subHeader: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 5,
    },
    incomeCard: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        marginBottom: 10,
    },
    incomeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    incomeName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    incomeAmount: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    incomeDate: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    cardGroup: {
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
    },
    groupTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 15,
    },
    budgetRow: {
        marginBottom: 15,
    },
    budgetInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    budgetName: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    budgetValues: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    goalRow: {
        marginBottom: 20,
    },
    goalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    goalName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    goalValues: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    goalRemaining: {
        color: COLORS.textSecondary,
        fontSize: 10,
        marginTop: 4,
    },
    payYourselfCard: {
        padding: 15,
        borderRadius: 12,
        marginTop: 5,
    },
    payTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    payDesc: {
        color: COLORS.textSecondary,
        fontSize: 12,
        lineHeight: 18,
    },
    addButton: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.accentBlue,
        borderStyle: 'dashed',
        alignItems: 'center',
        marginTop: 5,
    },
    addButtonText: {
        color: COLORS.accentBlue,
        fontSize: 14,
        fontWeight: '500',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingRight: 10,
    },
    editButton: {
        padding: 5,
    },
    editButtonText: {
        color: COLORS.accentBlue,
        fontSize: 14,
        fontWeight: '600',
    },
    incomeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    incomeContent: {
        flex: 1,
    },
    deleteButton: {
        marginRight: 15,
        padding: 5,
    },
    deleteIcon: {
        color: COLORS.accentRed,
        fontSize: 20,
        fontWeight: 'bold',
    },
    dragHandle: {
        marginLeft: 10,
        padding: 5,
    },
    dragIcon: {
        color: COLORS.textSecondary,
        fontSize: 20,
    },
    addNewButton: {
        backgroundColor: COLORS.accentBlue,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    addNewButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    incomeCardEditing: {
        borderColor: COLORS.accentBlue,
    },
});

export default IncomeScreen;
