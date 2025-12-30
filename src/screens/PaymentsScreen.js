import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SectionList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';
import { DataContext } from '../context/DataContext';
import EditModal from '../components/EditModal';
import CustomAlert from '../components/CustomAlert';
import CustomDatePicker from '../components/CustomDatePicker';

import OnboardingTooltip from '../components/OnboardingTooltip';

const PaymentsScreen = ({ scrollViewRef }) => {
    const { totalExpenses, budgets, theme, formatCurrency, transactions, groupTransactionsByDate, formatDate, recurringPayments, addRecurringPayment, updateRecurringPayment, deleteRecurringPayment, extraPayments, addExtraPayment, updateExtraPayment, deleteExtraPayment, totalBudgetLimit, setOnboardingStep, setCurrentScreen } = useContext(DataContext);

    // Use unified totalBudgetLimit from DataContext
    // const totalBudgetLimit = budgets.reduce((sum, item) => sum + Number(item.limit), 0);
    const isUnderBudget = totalExpenses < totalBudgetLimit;

    const totalFixedExpenses = recurringPayments.reduce((sum, item) => sum + item.amount, 0);
    const totalMonthlyCommitment = recurringPayments
        .filter(item => item.type === 'fixed' || item.type === 'subscription')
        .reduce((sum, item) => sum + item.amount, 0);
    const totalExtraExpenses = extraPayments.reduce((sum, item) => sum + item.amount, 0);

    const handleRecurringAction = (item) => {
        setAlertConfig({
            title: `${item.name} Aboneliği`,
            message: 'Ne yapmak istersiniz?',
            buttons: [
                {
                    text: 'Aboneliği Düzenle',
                    onPress: () => {
                        setAlertVisible(false);
                        setEditingId(item.id);
                        setNewName(item.name);
                        setNewAmount(item.amount.toString());
                        setPaymentType(item.type);
                        // Try to parse date or set default
                        setSelectedDate(new Date());
                        setModalVisible(true);
                    }
                },
                {
                    text: 'Ödendi Olarak İşaretle',
                    onPress: () => {
                        setAlertVisible(false);
                        console.log('Paid');
                    }
                },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        setAlertVisible(false);
                        setTimeout(() => {
                            setAlertConfig({
                                title: 'Emin misiniz?',
                                message: `${item.name} silinecek.`,
                                buttons: [
                                    { text: 'Vazgeç', style: 'cancel', onPress: () => setAlertVisible(false) },
                                    {
                                        text: 'Sil',
                                        style: 'destructive',
                                        onPress: () => {
                                            deleteRecurringPayment(item.id);
                                            setAlertVisible(false);
                                        }
                                    }
                                ]
                            });
                            setAlertVisible(true);
                        }, 500); // Wait for first alert to close
                    }
                },
                { text: 'Vazgeç', style: 'cancel', onPress: () => setAlertVisible(false) }
            ]
        });
        setAlertVisible(true);
    };

    const handleExtraPaymentPress = (item) => {
        setAlertConfig({
            title: 'Ek Ödeme Yönetimi',
            message: `${item.name} (${formatCurrency(item.amount)})`,
            buttons: [
                {
                    text: 'Düzenle',
                    onPress: () => {
                        setAlertVisible(false);
                        setEditingId(item.id);
                        setNewName(item.name);
                        setNewAmount(item.amount.toString());
                        setPaymentType('extra');
                        setSelectedDate(new Date());
                        setModalVisible(true);
                    }
                },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        setAlertVisible(false);
                        setTimeout(() => {
                            setAlertConfig({
                                title: 'Emin misiniz?',
                                message: `${item.name} silinecek.`,
                                buttons: [
                                    { text: 'Vazgeç', style: 'cancel', onPress: () => setAlertVisible(false) },
                                    {
                                        text: 'Sil',
                                        style: 'destructive',
                                        onPress: () => {
                                            deleteExtraPayment(item.id);
                                            setAlertVisible(false);
                                        }
                                    }
                                ]
                            });
                            setAlertVisible(true);
                        }, 500);
                    }
                },
                { text: 'Vazgeç', style: 'cancel', onPress: () => setAlertVisible(false) }
            ]
        });
        setAlertVisible(true);
    };

    const handleTransactionPress = (item) => {
        Alert.alert(
            'İşlem Detayı',
            `Tarih: ${item.timestamp ? formatDate(item.timestamp) : item.date}\nÖdeme Yöntemi: Kredi Kartı\nKonum: İstanbul, Kadıköy\nFiş: Eklenmemiş`,
            [{ text: 'Kapat', style: 'cancel' }]
        );
    };

    const handleTransactionLongPress = (item) => {
        Alert.alert(
            'İşlem Yönetimi',
            `${item.name} harcaması için:`,
            [
                { text: 'Düzenle', onPress: () => console.log('Edit') },
                { text: 'Bütçeden Hariç Tut', onPress: () => console.log('Exclude') },
                { text: 'Vazgeç', style: 'cancel' }
            ]
        );
    };

    const groupedTransactions = groupTransactionsByDate(transactions);

    const renderAnalysis = () => {
        // 1. Calculate Category Totals
        const fixedTotal = recurringPayments.filter(p => p.type === 'fixed').reduce((sum, item) => sum + item.amount, 0);
        const variableTotal = recurringPayments.filter(p => p.type === 'variable').reduce((sum, item) => sum + item.amount, 0);
        const subscriptionTotal = recurringPayments.filter(p => p.type === 'subscription').reduce((sum, item) => sum + item.amount, 0);
        const extraTotal = extraPayments.reduce((sum, item) => sum + item.amount, 0);
        const dailyTotal = transactions.reduce((sum, item) => sum + item.amount, 0);

        // 2. Prepare Chart Data
        const chartData = [
            { key: 'fixed', label: 'Sabit', amount: fixedTotal, color: COLORS.accentBlue },
            { key: 'variable', label: 'Değişken', amount: variableTotal, color: COLORS.accentYellow },
            { key: 'subscription', label: 'Abonelik', amount: subscriptionTotal, color: '#8b5cf6' }, // Purple
            { key: 'extra', label: 'Ekstra', amount: extraTotal, color: COLORS.accentRed },
            { key: 'daily', label: 'Günlük', amount: dailyTotal, color: COLORS.accentGreen },
        ].filter(item => item.amount > 0); // Only show categories with data

        // 3. Calculate Percentages for Chart Segments
        const totalCalculated = chartData.reduce((sum, item) => sum + item.amount, 0);
        const radius = 40;
        const circumference = 2 * Math.PI * radius; // ~251

        let currentAngle = -90; // Start from top

        // Handle case where totalBudgetLimit is 0 to avoid NaN
        const safeBudgetLimit = totalBudgetLimit > 0 ? totalBudgetLimit : 1;
        const spendingPercentage = totalBudgetLimit > 0 ? (totalExpenses / totalBudgetLimit * 100) : 0;

        const segments = chartData.map(item => {
            const percentage = item.amount / safeBudgetLimit; // Relative to Budget Limit
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const rotation = currentAngle;
            const angleDelta = (item.amount / safeBudgetLimit) * 360;
            currentAngle += angleDelta;

            return {
                ...item,
                percentage,
                strokeDasharray,
                rotation
            };
        });

        // 4. Render
        return (
            <OnboardingTooltip
                step={5}
                content="Harcama Analizi ile giderlerinizi kategorilere göre (sabit, değişken, abonelik) detaylıca inceleyebilirsiniz."
                placement="bottom"
                onNextOverride={() => setOnboardingStep(6)}
            >
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Harcama Analizi</Text>

                    <View style={styles.analysisContainer}>
                        {/* Chart Section */}
                        <View style={styles.chartSection}>
                            <View style={styles.chartWrapper}>
                                <Svg height="140" width="140" viewBox="0 0 100 100">
                                    {/* Background Circle (Budget Limit) */}
                                    <Circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />

                                    {/* Segments */}
                                    {segments.map((segment, index) => (
                                        <Circle
                                            key={segment.key}
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke={segment.color}
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={segment.strokeDasharray}
                                            strokeLinecap="round"
                                            rotation={segment.rotation}
                                            origin="50, 50"
                                        />
                                    ))}
                                </Svg>
                                <View style={styles.chartCenterText}>
                                    <Text style={[styles.centerPercentage, { color: isUnderBudget ? theme.textPrimary : COLORS.accentRed }]}>
                                        %{spendingPercentage.toFixed(0)}
                                    </Text>
                                    <Text style={[styles.centerLabel, { color: theme.textSecondary }]}>Harcanan</Text>
                                </View>
                            </View>
                            <View style={styles.budgetDisplay}>
                                <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>Toplam Bütçe</Text>
                                <Text style={[styles.budgetAmount, { color: theme.textPrimary }]}>{formatCurrency(safeBudgetLimit)}</Text>
                            </View>
                        </View>

                        {/* Legend Section */}
                        <View style={styles.legendSection}>
                            {chartData.map(item => {
                                const percent = totalExpenses > 0 ? (item.amount / totalExpenses * 100).toFixed(0) : 0;
                                return (
                                    <View key={item.key} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                        <Text style={[styles.legendLabel, { color: theme.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                                        <Text style={[styles.legendAmount, { color: theme.textPrimary }]}>{formatCurrency(item.amount)}</Text>
                                        <Text style={[styles.legendPercent, { color: theme.textSecondary }]}>%{percent}</Text>
                                    </View>
                                );
                            })}
                            <View style={[styles.legendItem, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                                <View style={[styles.legendDot, { backgroundColor: 'transparent' }]} />
                                <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Toplam</Text>
                                <Text style={[styles.legendAmount, { color: theme.textPrimary, fontWeight: 'bold' }]}>{formatCurrency(totalExpenses)}</Text>
                                <Text style={[styles.legendPercent, { color: theme.textSecondary, width: 'auto', marginLeft: 5 }]}>
                                    / {formatCurrency(totalBudgetLimit)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => !isUnderBudget && Alert.alert('Limit Yönetimi', 'Harcama limitleri ekranına yönlendiriliyorsunuz...')}>
                        <Text style={[styles.feedbackText, !isUnderBudget && { color: COLORS.accentRed, textDecorationLine: 'underline' }]}>
                            {isUnderBudget ? 'Bütçe dahilindesiniz 🟢' : '⚠️ Bütçeyi aşıyorsunuz (Yönet)'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </OnboardingTooltip>
        );
    };

    const [modalVisible, setModalVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [frequency, setFrequency] = useState('Aylık'); // 'Aylık', 'Haftalık', 'Yıllık'
    const [paymentType, setPaymentType] = useState('fixed'); // 'fixed', 'variable', 'subscription', 'extra'
    const [selectedDate, setSelectedDate] = useState(null);
    const [pickerVisible, setPickerVisible] = useState(false);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleAddPayment = () => {
        if (!newName || !newAmount || !selectedDate) {
            setAlertConfig({
                title: 'Hata',
                message: 'Lütfen tüm alanları doldurun.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }

        if (paymentType === 'extra') {
            const paymentData = {
                id: editingId || Date.now(),
                name: newName,
                amount: Number(newAmount),
                date: selectedDate.toLocaleDateString('tr-TR'),
                type: 'extra'
            };

            if (editingId) {
                updateExtraPayment(paymentData);
            } else {
                addExtraPayment(paymentData);
            }
        } else {
            const day = selectedDate.getDate();
            let estDescription = '';

            if (frequency === 'Aylık') {
                estDescription = `Her ayın ${day}'i`;
            } else if (frequency === 'Haftalık') {
                const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                estDescription = `Her ${days[selectedDate.getDay()]}`;
            } else {
                const month = selectedDate.toLocaleString('tr-TR', { month: 'long' });
                estDescription = `Her yıl ${day} ${month}`;
            }

            const paymentData = {
                id: editingId || Date.now(),
                name: newName,
                amount: Number(newAmount),
                date: estDescription,
                est: `Tahmini: ${formatCurrency(Number(newAmount))}`,
                type: paymentType
            };

            if (editingId) {
                updateRecurringPayment(paymentData);
            } else {
                addRecurringPayment(paymentData);
            }
        }

        setModalVisible(false);
        setEditingId(null);
        setNewName('');
        setNewAmount('');
        setSelectedDate(null);
        setFrequency('Aylık');
        setPaymentType('fixed');
    };

    const renderAddPaymentModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <BlurView intensity={90} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{editingId ? 'Ödemeyi Düzenle' : 'Yeni Ödeme Ekle'}</Text>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Ödeme Adı</Text>
                    <TextInput
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
                        placeholder="Örn: Netflix"
                        placeholderTextColor={theme.textSecondary}
                        value={newName}
                        onChangeText={setNewName}
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Tutar</Text>
                    <TextInput
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={newAmount}
                        onChangeText={setNewAmount}
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Ödeme Türü</Text>
                    <View style={styles.typeContainer}>
                        {[
                            { id: 'fixed', label: 'Sabit' },
                            { id: 'variable', label: 'Değişken' },
                            { id: 'subscription', label: 'Abonelik' },
                            { id: 'extra', label: 'Ek Ödeme' }
                        ].map(type => (
                            <TouchableOpacity
                                key={type.id}
                                style={[styles.typeButton, paymentType === type.id && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                                onPress={() => setPaymentType(type.id)}
                            >
                                <Text style={[styles.typeText, { color: theme.textSecondary }, paymentType === type.id && { color: 'white', fontWeight: 'bold' }]}>{type.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {paymentType !== 'extra' && (
                        <>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Ödeme Sıklığı</Text>
                            <View style={styles.frequencyContainer}>
                                {['Aylık', 'Haftalık', 'Yıllık'].map(freq => (
                                    <TouchableOpacity
                                        key={freq}
                                        style={[styles.frequencyButton, frequency === freq && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                                        onPress={() => setFrequency(freq)}
                                    >
                                        <Text style={[styles.frequencyText, { color: theme.textSecondary }, frequency === freq && { color: 'white', fontWeight: 'bold' }]}>{freq}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Başlangıç Tarihi</Text>
                    <TouchableOpacity
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, justifyContent: 'center' }]}
                        onPress={() => setPickerVisible(true)}
                    >
                        <Text style={{ color: selectedDate ? theme.textPrimary : theme.textSecondary }}>
                            {selectedDate ? selectedDate.toLocaleDateString('tr-TR') : 'Tarih Seçin'}
                        </Text>
                    </TouchableOpacity>
                    {selectedDate && paymentType !== 'extra' && (
                        <Text style={[styles.feedbackText, { marginTop: -10, marginBottom: 15, color: theme.textSecondary, opacity: 0.7 }]}>
                            Seçilen tarihe göre, bu ödeme {frequency === 'Aylık' ? `her ayın ${selectedDate.getDate()}. günü` : frequency === 'Haftalık' ? `her hafta` : `her yıl`} tekrarlanacaktır.
                        </Text>
                    )}

                    <CustomDatePicker
                        visible={pickerVisible}
                        onClose={() => setPickerVisible(false)}
                        onSelect={handleDateSelect}
                        title="Başlangıç Tarihi Seç"
                        initialDate={selectedDate}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.glassBorder }]} onPress={() => {
                            setModalVisible(false);
                            setEditingId(null);
                            setNewName('');
                            setNewAmount('');
                        }}>
                            <Text style={{ color: theme.textSecondary }}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.accent }]} onPress={handleAddPayment}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{editingId ? 'Kaydet' : 'Ekle'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderGroupedRecurring = () => {
        const fixed = recurringPayments.filter(p => p.type === 'fixed');
        const variable = recurringPayments.filter(p => p.type === 'variable');
        const subscriptions = recurringPayments.filter(p => p.type === 'subscription');

        const renderSection = (title, data, icon) => (
            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.subHeaderTitle, { color: theme.textSecondary }]}>{icon} {title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recurringList}>
                    {data.map(item => (
                        <TouchableOpacity key={item.id} onLongPress={() => handleRecurringAction(item)} activeOpacity={0.8}>
                            <View style={[styles.recurringCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                <View style={styles.recurringHeader}>
                                    <Text style={[styles.recurringName, { color: theme.textPrimary }]}>{item.name}</Text>
                                    <Text style={[styles.recurringAmount, { color: theme.textSecondary }]}>{formatCurrency(item.amount)}</Text>
                                </View>
                                <Text style={[styles.recurringDate, { color: theme.textSecondary }]}>{item.date}</Text>
                                <Text style={[styles.recurringEst, { color: theme.accent }]}>{item.est}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {data.length === 0 && (
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic', padding: 10 }}>Bu kategoride ödeme yok.</Text>
                    )}
                </ScrollView>
            </View>
        );

        return (
            <OnboardingTooltip
                step={6}
                content="Düzenli giderlerinizi buradan takip edebilir, yaklaşan ödemelerinizi görebilirsiniz."
                placement="top"
                onNextOverride={() => {
                    setOnboardingStep(7); // Next Step
                    setCurrentScreen('Home'); // Go Home for FAB
                }}
            >
                <View style={styles.sectionContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={[styles.headerTitle, { color: theme.textSecondary, marginBottom: 0 }]}>Düzenli Giderler</Text>
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '600' }}>+ Ekle</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 15 }}>Toplam Aylık Taahhüt: <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{formatCurrency(totalMonthlyCommitment)}</Text></Text>

                    {renderSection('Sabit Ödemeler', fixed, '🏠')}
                    {renderSection('Değişken Faturalar', variable, '💡')}
                    {renderSection('Abonelikler', subscriptions, '📺')}
                </View>
            </OnboardingTooltip>
        );
    };

    const renderExtraPayments = () => (
        <View style={styles.sectionContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.headerTitle, { color: theme.textSecondary, marginBottom: 0 }]}>Ek Ödemeler</Text>
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>Toplam: {formatCurrency(totalExtraExpenses)}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recurringList}>
                {extraPayments.map(item => (
                    <TouchableOpacity key={item.id} onPress={() => handleExtraPaymentPress(item)} activeOpacity={0.8}>
                        <View style={[styles.recurringCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.recurringHeader}>
                                <Text style={[styles.recurringName, { color: theme.textPrimary }]}>{item.name}</Text>
                                <Text style={[styles.recurringAmount, { color: theme.textSecondary }]}>{formatCurrency(item.amount)}</Text>
                            </View>
                            <Text style={[styles.recurringDate, { color: theme.textSecondary }]}>{item.date}</Text>
                            <Text style={[styles.recurringEst, { color: COLORS.accentRed }]}>Tek Seferlik</Text>
                        </View>
                    </TouchableOpacity>
                ))}
                {extraPayments.length === 0 && (
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic', padding: 10 }}>Ek ödeme bulunmuyor.</Text>
                )}
            </ScrollView>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SectionList
                ref={scrollViewRef} // Using the ref passed from parent if strictly needed, though SectionList ref interface differs slightly from ScrollView
                sections={groupedTransactions}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.scrollContent}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {renderAnalysis()}
                        {renderGroupedRecurring()}
                        {renderExtraPayments()}
                        {renderAddPaymentModal()}
                        <Text style={[styles.headerTitle, { color: theme.textSecondary, marginTop: 10 }]}>İşlem Geçmişi</Text>
                    </>
                }
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={[styles.dateHeader, { color: theme.textSecondary }]}>{title}</Text>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleTransactionPress(item)}
                        onLongPress={() => handleTransactionLongPress(item)}
                    >
                        <View style={[styles.transactionRow, { backgroundColor: theme.cardBg }]}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: theme.glassBorder }]}>
                                    <Text style={styles.icon}>{item.icon}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.transName, { color: theme.textPrimary }]}>{item.category}</Text>
                                    <Text style={[styles.transCategory, { color: theme.textSecondary }]}>{item.name}</Text>
                                </View>
                            </View>
                            <Text style={[styles.transAmount, { color: COLORS.accentRed }]}>-{formatCurrency(item.amount)}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListFooterComponent={<View style={{ height: 100 }} />}
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
        paddingHorizontal: 10,
        paddingTop: 10,

    },
    sectionCard: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 2,
        borderColor: COLORS.glassBorder,
        marginBottom: 20,
        overflow: 'hidden',
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 15,
    },
    analysisContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: -1,

    },
    chartSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 1,
    },
    chartWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartCenterText: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerPercentage: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    centerLabel: {
        fontSize: 10,
    },
    budgetDisplay: {
        marginTop: 10,
        alignItems: 'center',
    },
    budgetLabel: {
        fontSize: 10,
        marginBottom: 2,
    },
    budgetAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
    legendSection: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
        paddingLeft: 10, // Add some spacing from chart
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between', // Removed to bring items closer
        minHeight: 20,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    legendLabel: {
        fontSize: 12,
        width: 70, // Fixed width for alignment
    },
    legendAmount: {
        fontSize: 12,
        fontWeight: '500',
        width: 60, // Fixed width for alignment
        textAlign: 'right',
        marginRight: 5,
    },
    legendPercent: {
        fontSize: 11,
        width: 30,
        textAlign: 'right',
    },
    feedbackText: {
        color: COLORS.accentGreen,
        fontSize: 12,
        marginTop: 15,
        fontWeight: '500',
        textAlign: 'center',
    },
    sectionContainer: {
        marginBottom: 20,
    },
    headerTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 10,
        marginLeft: 5,
    },
    recurringList: {
        gap: 10,
    },
    recurringCard: {
        width: 160,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        overflow: 'hidden', // Fix: Prevent content/background overflow
    },
    recurringHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    recurringName: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
    recurringAmount: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
    recurringDate: {
        color: COLORS.textSecondary,
        fontSize: 10,
        marginBottom: 2,
    },
    recurringEst: {
        fontSize: 10,
        fontWeight: '500',
    },
    transactionSection: {
        marginBottom: 15,
    },
    dateHeader: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 5,
    },
    transactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 20,
    },
    transName: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    transCategory: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    transAmount: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    addCard: {
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
    },
    addIcon: {
        fontSize: 24,
        fontWeight: '300',
        marginBottom: 5,
    },
    addText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 5,
        marginLeft: 5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        fontSize: 14,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    frequencyContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    frequencyButton: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        alignItems: 'center',
    },
    frequencyText: {
        fontSize: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    typeText: {
        fontSize: 12,
    },
    subHeaderTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 5,
    },
});

export default PaymentsScreen;
