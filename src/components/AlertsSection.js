import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import CustomAlert from './CustomAlert';

import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

const AlertsSection = () => {
    const { theme } = useContext(DataContext);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
    const [paidAlerts, setPaidAlerts] = useState([]);

    const handlePay = (id) => {
        setAlertConfig({
            title: "Ödeme İşlemi",
            message: "Ödeme banka uygulamasına yönlendiriliyor veya ödendi olarak işaretleniyor.",
            buttons: [
                { text: "Vazgeç", style: "cancel", onPress: () => setAlertVisible(false) },
                {
                    text: "Tamam",
                    onPress: () => {
                        setPaidAlerts(prev => [...prev, id]);
                        setAlertVisible(false);
                    }
                }
            ]
        });
        setAlertVisible(true);
    };

    const handleInspect = () => {
        setAlertConfig({
            title: "Detaylı Analiz",
            message: "Fatura geçmişi ve ortalama karşılaştırma grafiği açılıyor...",
            buttons: [{ text: "Tamam", onPress: () => setAlertVisible(false) }]
        });
        setAlertVisible(true);
    };

    const handleDetail = () => {
        setAlertConfig({
            title: "Harcama Analizi",
            message: "Eğlence kategorisi harcama detayları ve bütçe düzenleme ekranı açılıyor...",
            buttons: [{ text: "Tamam", onPress: () => setAlertVisible(false) }]
        });
        setAlertVisible(true);
    };

    const alerts = [
        {
            id: 1,
            type: 'payment',
            title: 'Elektrik Faturası',
            amount: '₺350',
            timeLeft: '5 gün kaldı',
            date: { day: '17', month: 'KAS' },
            aiNote: 'Ortalama: ₺340 (Normal)',
            action: 'Öde',
            colors: ['rgba(59, 130, 246, 0.2)', 'rgba(30, 41, 59, 0.8)'],
            borderColor: COLORS.accentBlue
        },
        {
            id: 2,
            type: 'anomaly',
            title: 'Anormallik Uyarısı (YZ)',
            message: 'Bu ay Elektrik Faturası (₺480) geçen aylık ortalamanızın %40 üzerinde.',
            icon: '⚠️',
            action: 'İncele',
            colors: ['rgba(245, 158, 11, 0.2)', 'rgba(30, 41, 59, 0.8)'],
            borderColor: COLORS.accentYellow
        },
        {
            id: 3,
            type: 'limit',
            title: 'Harcama Limiti Uyarısı',
            message: 'Eğlence kategorisindeki bütçenizin %95\'ine ulaştınız.',
            remaining: 'Kalan: ₺250',
            icon: '🔴',
            action: 'Detay',
            colors: ['rgba(239, 68, 68, 0.2)', 'rgba(30, 41, 59, 0.8)'],
            borderColor: COLORS.accentRed
        }
    ];

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Hızlı Eylem ve Uyarılar</Text>
            <View style={styles.list}>
                {alerts.map(alert => {
                    const isPaid = paidAlerts.includes(alert.id);
                    return (
                        <LinearGradient
                            key={alert.id}
                            colors={alert.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.card, { borderLeftColor: alert.borderColor, borderColor: theme.glassBorder }]}
                        >
                            {/* Left Side: Date Box or Icon */}
                            <View style={styles.leftSide}>
                                {alert.type === 'payment' ? (
                                    <View style={[styles.dateBox, { backgroundColor: theme.glassBorder }]}>
                                        <Text style={[styles.dateDay, { color: theme.textPrimary }]}>{alert.date.day}</Text>
                                        <Text style={[styles.dateMonth, { color: theme.textSecondary }]}>{alert.date.month}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.icon}>{alert.icon}</Text>
                                )}
                            </View>

                            {/* Middle: Content */}
                            <View style={styles.content}>
                                <Text style={[styles.title, { color: theme.textPrimary }]}>{alert.title}</Text>

                                {alert.type === 'payment' ? (
                                    <View>
                                        <Text style={[styles.amountText, { color: theme.textPrimary }]}>
                                            {alert.amount} <Text style={styles.timeLeft}>• {alert.timeLeft}</Text>
                                        </Text>
                                        <Text style={[styles.aiNote, { color: theme.textSecondary }]}>{alert.aiNote}</Text>
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={[styles.message, { color: theme.textSecondary }]}>{alert.message}</Text>
                                        {alert.remaining && <Text style={styles.remainingText}>{alert.remaining}</Text>}
                                    </View>
                                )}
                            </View>

                            {/* Right: Action Button */}
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    alert.type === 'payment' && { backgroundColor: COLORS.accentBlue, borderColor: COLORS.accentBlue },
                                    alert.type !== 'payment' && { borderColor: theme.glassBorder },
                                    isPaid && { backgroundColor: 'transparent', borderColor: theme.glassBorder, opacity: 0.5 }
                                ]}
                                onPress={() => {
                                    if (isPaid) return;
                                    if (alert.type === 'payment') handlePay(alert.id);
                                    if (alert.type === 'anomaly') handleInspect();
                                    if (alert.type === 'limit') handleDetail();
                                }}
                                disabled={isPaid}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    { color: theme.textPrimary },
                                    alert.type === 'payment' && { color: 'white', fontWeight: '700' },
                                    isPaid && { color: theme.textSecondary, fontWeight: '500' }
                                ]}>
                                    {isPaid ? 'Ödendi' : alert.action}
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    );
                })}
            </View>
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
    list: {
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    leftSide: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    dateBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignItems: 'center',
        minWidth: 48,
    },
    dateDay: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
    },
    dateMonth: {
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    icon: {
        fontSize: 28,
    },
    content: {
        flex: 1,
        paddingRight: 10,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        color: COLORS.textSecondary,
        fontSize: 12,
        lineHeight: 16,
    },
    amountText: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    timeLeft: {
        color: COLORS.accentRed,
        fontSize: 13,
        fontWeight: '500',
    },
    aiNote: {
        color: COLORS.textSecondary,
        fontSize: 11,
        marginTop: 2,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonText: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '500',
    },
    remainingText: {
        color: COLORS.accentRed,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
});

export default AlertsSection;
