import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../constants/theme';
import { DataContext } from '../context/DataContext';
import CustomAlert from './CustomAlert';

const { width } = Dimensions.get('window');

import OnboardingTooltip from './OnboardingTooltip';

const DebtsSection = () => {
    const { theme, financialData, formatCurrency, payDebt, payOffDebt, debtsList, addDebt, formatDate, setCurrentScreen, setOnboardingStep } = useContext(DataContext);

    // UI State
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'paid'
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);

    // Quick Pay / Add Debt State
    const [modalVisible, setModalVisible] = useState(false); // For Quick Pay (Regular)
    const [manageModalVisible, setManageModalVisible] = useState(false); // For Adding Debt
    const [paymentAmount, setPaymentAmount] = useState('');
    const [newDebtName, setNewDebtName] = useState('');
    const [newDebtAmount, setNewDebtAmount] = useState('');

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    const totalDebt = financialData.debts;

    // Filter Debts
    const displayedDebts = debtsList.filter(d =>
        activeTab === 'active' ? (d.status === 'active' || !d.status) : d.status === 'paid'
    );

    // --- Actions ---

    const handleDebtClick = (debt) => {
        setSelectedDebt(debt);
        if (activeTab === 'active') {
            setDetailModalVisible(true);
        }
    };

    const handlePayOff = () => {
        // Close the detail modal first to avoid overlapping modal issues
        setDetailModalVisible(false);

        // Delay increased to 600ms to ensure iOS animation completes fully prevents freezing
        setTimeout(() => {
            if (!selectedDebt) return; // Safety check
            setAlertConfig({
                title: 'Ödeme Kaynağı Seçin',
                message: `₺${formatCurrency(selectedDebt.remainingAmount)} tutarındaki borcu hangi kaynaktan kapatmak istersiniz?`,
                buttons: [
                    {
                        text: 'Varlıklardan Öde',
                        style: 'default', // Maybe accent color? CustomAlert logic uses accent for default
                        onPress: () => executePayOff('asset')
                    },
                    {
                        text: 'Bütçeden Öde',
                        style: 'default',
                        onPress: () => executePayOff('budget')
                    },
                    {
                        text: 'İptal',
                        style: 'cancel',
                        onPress: () => setAlertVisible(false)
                    }
                ]
            });
            setAlertVisible(true);
        }, 600);
    };

    const executePayOff = (source) => {
        if (!selectedDebt) return;

        // 1. Perform Logic with source
        payOffDebt(selectedDebt.id, source);

        // 2. Detail Modal is already closed in handlePayOff

        // 3. Close confirmation
        setAlertVisible(false);

        setTimeout(() => {
            setAlertConfig({
                title: 'Tebrikler! 🎉',
                message: `"${selectedDebt.name}" borcunu başarıyla kapattınız. Net servetiniz güncellendi.`,
                buttons: [{ text: 'Harika', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
        }, 600);
    };

    const handleQuickPay = () => {
        if (!paymentAmount || isNaN(paymentAmount)) {
            setAlertConfig({
                title: 'Hata',
                message: 'Lütfen geçerli bir tutar girin.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }

        // Close input modal first
        setModalVisible(false);
        setDetailModalVisible(false); // Close detail modal if open

        // Delay for iOS modal transition
        setTimeout(() => {
            setAlertConfig({
                title: 'Ödeme Kaynağı Seçin',
                message: `${formatCurrency(paymentAmount)} tutarındaki ödemeyi hangi kaynaktan yapmak istersiniz?`,
                buttons: [
                    {
                        text: 'Varlıklardan Öde',
                        style: 'default',
                        onPress: () => executeQuickPay('asset')
                    },
                    {
                        text: 'Bütçeden Öde',
                        style: 'default',
                        onPress: () => executeQuickPay('budget')
                    },
                    {
                        text: 'İptal',
                        style: 'cancel',
                        onPress: () => setAlertVisible(false)
                    }
                ]
            });
            setAlertVisible(true);
        }, 600);
    };

    const executeQuickPay = (source) => {
        const debtName = selectedDebt ? selectedDebt.name : 'Borç';
        // If coming from Detail Modal -> selectedDebt is set.

        payDebt(paymentAmount, `${debtName} Ödemesi`, selectedDebt?.id, source);

        setPaymentAmount('');
        // setDetailModalVisible(false); // Already closed before this flow starts usually

        // Close source selection alert
        setAlertVisible(false);

        setTimeout(() => {
            setAlertConfig({
                title: 'Ödeme Başarılı',
                message: `${formatCurrency(paymentAmount)} tutarında ödeme yapıldı.\n"${debtName}" Borcunuz azaldı.`,
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
        }, 600);
    };

    const handleAddDebt = () => {
        if (!newDebtName || !newDebtAmount) {
            setAlertConfig({
                title: 'Hata',
                message: 'Lütfen isim ve tutar girin.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }

        const amount = parseFloat(newDebtAmount);
        addDebt({
            name: newDebtName,
            remainingAmount: amount,
            totalAmount: amount,
            icon: '📄'
        });

        setNewDebtName('');
        setNewDebtAmount('');
        setManageModalVisible(false);

        setAlertConfig({
            title: 'Başarılı',
            message: 'Yeni borç kalemi eklendi.',
            buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
        });
        setAlertVisible(true);
    };

    return (
        <View style={styles.container}>
            <OnboardingTooltip
                step={3}
                content={`Bu alanda aktif borçlarınızı takip edebilir, ödeme yaptıkça toplam borcunuzu ₺ anlık olarak düşürebilirsiniz.`}
                placement="top"
                onNextOverride={() => {
                    setOnboardingStep(4);
                    setCurrentScreen('Income');
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 }}>
                    <Text style={styles.sectionTitle}>Borçlarım ve Kredilerim</Text>
                    <TouchableOpacity onPress={() => setManageModalVisible(true)}>
                        <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}>+ Ekle</Text>
                    </TouchableOpacity>
                </View>
            </OnboardingTooltip>

            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                {/* Header (Tabs & Total) */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Kalan</Text>
                        <Text style={[styles.mainValue, { color: COLORS.accentRed }]}>{formatCurrency(totalDebt)}</Text>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabContainer, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'active' && { backgroundColor: theme.cardBg }]}
                            onPress={() => setActiveTab('active')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'active' ? theme.accent : theme.textSecondary }]}>Aktif</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'paid' && { backgroundColor: theme.cardBg }]}
                            onPress={() => setActiveTab('paid')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'paid' ? theme.accent : theme.textSecondary }]}>Ödenmiş</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List */}
                <View style={styles.listContainer}>
                    {displayedDebts.length === 0 ? (
                        <Text style={{ color: theme.textSecondary, textAlign: 'center', fontStyle: 'italic', padding: 10 }}>
                            {activeTab === 'active' ? 'Aktif borcunuz bulunmuyor.' : 'Henüz ödenmiş borç geçmişi yok.'}
                        </Text>
                    ) : (
                        displayedDebts.map((debt, index) => {
                            const progress = debt.totalAmount > 0 ? 1 - (debt.remainingAmount / debt.totalAmount) : 0;
                            return (
                                <TouchableOpacity
                                    key={debt.id}
                                    style={[styles.debtItem, index !== displayedDebts.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.glassBorder }]}
                                    onPress={() => handleDebtClick(debt)}
                                    disabled={activeTab === 'paid'}
                                >
                                    <View style={styles.debtHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 16, marginRight: 8 }}>{debt.icon}</Text>
                                            <View>
                                                <Text style={[styles.debtName, { color: theme.textPrimary }]}>{debt.name}</Text>
                                                {activeTab === 'paid' && <Text style={{ fontSize: 10, color: theme.textSecondary }}>Kapanış: {formatDate(debt.completedDate)}</Text>}
                                            </View>
                                        </View>
                                        <Text style={[styles.debtAmount, { color: activeTab === 'paid' ? COLORS.accentGreen : theme.textPrimary }]}>
                                            {activeTab === 'paid' ? 'ÖDENDİ' : formatCurrency(debt.remainingAmount)}
                                        </Text>
                                    </View>

                                    {activeTab === 'active' && (
                                        <View style={styles.progressContainer}>
                                            <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                                <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: COLORS.accentGreen }]} />
                                            </View>
                                            <Text style={[styles.progressText, { color: theme.textSecondary }]}>%{Math.round(progress * 100)} ödendi</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </View>

            {/* DETAIL MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 40, marginBottom: 10 }}>{selectedDebt?.icon}</Text>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{selectedDebt?.name}</Text>
                            <Text style={[styles.mainValue, { color: COLORS.accentRed }]}>{formatCurrency(selectedDebt?.remainingAmount)}</Text>
                            <Text style={{ color: theme.textSecondary, marginTop: 5 }}>Toplam Tutar: {formatCurrency(selectedDebt?.totalAmount)}</Text>
                        </View>

                        <View style={styles.modalActionsVertical}>
                            <TouchableOpacity
                                style={[styles.actionButtonLarge, { backgroundColor: COLORS.accentRed }]}
                                onPress={handlePayOff}
                            >
                                <Text style={[styles.actionButtonTextLarge, { color: 'white' }]}>Kapat</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Hepsini Öde</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButtonLarge, { backgroundColor: theme.accent, marginTop: 10 }]}
                                onPress={() => {
                                    setDetailModalVisible(false);
                                    setModalVisible(true); // Open regular payment modal
                                }}
                            >
                                <Text style={[styles.actionButtonTextLarge, { color: 'white' }]}>Ödeme Yap</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setDetailModalVisible(false)}>
                                <Text style={{ color: theme.textSecondary }}>Kapat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Quick Pay Modal (Regular Payment) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
                        <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Ara Ödeme</Text>
                            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                                {selectedDebt ? `"${selectedDebt.name}" için ödeme yapıyorsunuz.` : 'Genel borç ödemesi.'}
                            </Text>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Ödeme Tutarı</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                                    placeholder="Örn: 5000"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="numeric"
                                    value={paymentAmount}
                                    onChangeText={setPaymentAmount}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.modalButton, { borderColor: theme.glassBorder }]} onPress={() => setModalVisible(false)}>
                                    <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: COLORS.accentGreen, borderColor: 'transparent' }]}
                                    onPress={handleQuickPay}
                                >
                                    <Text style={[styles.modalButtonText, { color: 'white', fontWeight: 'bold' }]}>Öde</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Add Debt Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={manageModalVisible}
                onRequestClose={() => setManageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
                        <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Yeni Borç Ekle</Text>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Borç Adı</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                                    placeholder="Örn: Ev Kredisi"
                                    placeholderTextColor={theme.textSecondary}
                                    value={newDebtName}
                                    onChangeText={setNewDebtName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Toplam Tutar</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                                    placeholder="Örn: 50000"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="numeric"
                                    value={newDebtAmount}
                                    onChangeText={setNewDebtAmount}
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.modalButton, { borderColor: theme.glassBorder }]} onPress={() => setManageModalVisible(false)}>
                                    <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: theme.accent, borderColor: 'transparent' }]}
                                    onPress={handleAddDebt}
                                >
                                    <Text style={[styles.modalButtonText, { color: 'white', fontWeight: 'bold' }]}>Ekle</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

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
        marginBottom: 20,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        padding: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
    },
    mainValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    tabContainer: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
    },
    tabButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContainer: {
        gap: 15,
    },
    debtItem: {
        paddingBottom: 15,
    },
    debtHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    debtName: {
        fontSize: 14,
        fontWeight: '500',
    },
    debtAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressContainer: {
        gap: 5,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        alignSelf: 'flex-end',
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
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 12,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
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
    },
    modalActionsVertical: {
        width: '100%',
        gap: 10,
        alignItems: 'center'
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonLarge: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        fontSize: 16,
    },
    actionButtonTextLarge: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DebtsSection;
