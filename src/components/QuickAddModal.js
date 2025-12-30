import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

import { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import CustomDatePicker from './CustomDatePicker';
import CustomAlert from './CustomAlert';
import * as financeApi from '../services/financeApi';

const QuickAddModal = ({ visible, onClose }) => {
    const { theme, addAsset, userSettings, accounts, addTransaction, formatDate, addRecurringPayment, addExtraPayment, payDebt, addIncome, addToAssets, formatCurrency } = useContext(DataContext);
    const [activeType, setActiveType] = useState(null); // null, 'expense', 'income', 'investment', 'regular_payment', 'extra_payment'
    const [miniMenuVisible, setMiniMenuVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    // Date Picker State
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateField, setDateField] = useState(null); // 'regular' or 'extra'

    // Regular Payment Form State
    const [regName, setRegName] = useState('');
    const [regAmount, setRegAmount] = useState('');
    const [regFreq, setRegFreq] = useState('Aylık');
    const [regType, setRegType] = useState('fixed'); // fixed, variable, subscription

    // Extra Payment Form State
    const [extraName, setExtraName] = useState('');
    const [extraAmount, setExtraAmount] = useState('');

    // Income Form State
    const [incAmount, setIncAmount] = useState('');
    const [incSource, setIncSource] = useState('');
    const [incType, setIncType] = useState('irregular'); // 'regular', 'irregular'

    // Expense Form State
    const [expAmount, setExpAmount] = useState('');
    const [expDesc, setExpDesc] = useState('');
    const [expCategory, setExpCategory] = useState(null);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [expPaymentMethod, setExpPaymentMethod] = useState(null);
    const [expDate, setExpDate] = useState(new Date());
    const [expType, setExpType] = useState('daily'); // 'daily' or 'variable'

    // Mock AI Logic
    const handleDescChange = (text) => {
        setExpDesc(text);
        if (text.toLowerCase().includes('starbucks') || text.toLowerCase().includes('kahve')) {
            setAiSuggestion('Yiyecek & İçecek');
        } else if (text.toLowerCase().includes('migros') || text.toLowerCase().includes('market')) {
            setAiSuggestion('Market');
        } else if (text.toLowerCase().includes('taksi') || text.toLowerCase().includes('uber')) {
            setAiSuggestion('Ulaşım');
        } else {
            setAiSuggestion(null);
        }
    };

    const confirmAiSuggestion = () => {
        setExpCategory(aiSuggestion);
        setAiSuggestion(null);
    };

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'Gıda': return '🍔';
            case 'Ulaşım': return '🚕';
            case 'Market': return '🛒';
            case 'Eğlence': return '🎉';
            case 'Kira': return '🏠';
            case 'Fatura': return '💡';
            default: return '💸';
        }
    };

    const resetExpenseForm = () => {
        setExpAmount('');
        setExpDesc('');
        setExpCategory(null);
        setExpPaymentMethod(null);
        setExpDate(new Date());
        setExpType('daily');
        setAiSuggestion(null);
    };

    const handleClose = () => {
        if (expAmount || expDesc || expCategory) {
            setAlertConfig({
                title: 'Kaydedilmemiş Değişiklikler',
                message: 'Kaydedilmemiş verileriniz silinecektir. Emin misiniz?',
                buttons: [
                    { text: 'Vazgeç', style: 'cancel', onPress: () => setAlertVisible(false) },
                    {
                        text: 'Evet, Sil',
                        style: 'destructive',
                        onPress: () => {
                            resetExpenseForm();
                            setAlertVisible(false);
                            onClose();
                        }
                    }
                ]
            });
            setAlertVisible(true);
        } else {
            resetExpenseForm();
            onClose();
        }
    };

    const handleAddExpense = () => {
        if (expType === 'variable') {
            const day = expDate.getDate();
            const estDescription = `Her ayın ${day}'i`;

            addRecurringPayment({
                name: expDesc || 'Değişken Fatura',
                amount: parseFloat(expAmount) || 0,
                date: estDescription,
                est: `Tahmini: ₺${expAmount}`,
                type: 'variable'
            });
        } else {
            if (expCategory === 'Borç Ödemesi') {
                payDebt(parseFloat(expAmount) || 0, expDesc || 'Borç Ödemesi');
                setAlertConfig({
                    title: 'Başarılı',
                    message: 'Borç ödemesi kaydedildi ve borcunuz düşüldü.',
                    buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
                });
                setAlertVisible(true);
            } else {
                const newExpense = {
                    id: Date.now(),
                    name: expDesc || 'Harcama',
                    category: expCategory || 'Diğer',
                    amount: parseFloat(expAmount) || 0,
                    icon: getCategoryIcon(expCategory),
                    date: formatDate(expDate.toISOString()),
                    timestamp: expDate.toISOString(),
                    paymentMethod: expPaymentMethod
                };
                addTransaction(newExpense);
            }
        }
        resetExpenseForm();
        onClose();
    };

    // Investment Form State
    const [invType, setInvType] = useState('gold'); // gold, currency, stock, crypto, fund, real_estate, cash
    const [invAmount, setInvAmount] = useState('');
    const [invPrice, setInvPrice] = useState('');
    const [invName, setInvName] = useState(''); // For Crypto, Stock, Real Estate
    const [invEstValue, setInvEstValue] = useState(''); // For Real Estate

    // Live Price State
    const [liveAssets, setLiveAssets] = useState([]);
    const [selectedLiveAsset, setSelectedLiveAsset] = useState(null);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const [priceError, setPriceError] = useState(null);

    // Fetch live prices when investment type changes
    useEffect(() => {
        let isMounted = true;

        const fetchLivePrices = async () => {
            if (!visible || activeType !== 'investment') return;

            if (isMounted) {
                setIsLoadingPrices(true);
                setPriceError(null);
                setLiveAssets([]);
                setSelectedLiveAsset(null);
            }

            try {
                let result;
                switch (invType) {
                    case 'gold':
                        result = await financeApi.getGoldPrices();
                        if (isMounted && result.success && result.data) {
                            const goldItems = result.data.map(item => ({
                                id: item.name,
                                name: item.name,
                                buyPrice: parseFloat(item.buying) || 0,
                                sellPrice: parseFloat(item.selling) || 0
                            }));
                            setLiveAssets(goldItems);
                        }
                        break;
                    case 'currency':
                        result = await financeApi.getExchangeRates();
                        if (isMounted && result.success && result.data) {
                            const currencyItems = result.data.map(item => ({
                                id: item.code,
                                name: `${item.name} (${item.code})`,
                                buyPrice: parseFloat(item.buying) || 0,
                                sellPrice: parseFloat(item.selling) || 0
                            }));
                            setLiveAssets(currencyItems);
                        }
                        break;
                    case 'crypto':
                        result = await financeApi.getCryptoPrices();
                        if (isMounted && result.success && result.data) {
                            const cryptoItems = result.data.map(item => ({
                                id: item.code,
                                name: `${item.name} (${item.code})`,
                                buyPrice: parseFloat(item.price) || 0,
                                sellPrice: parseFloat(item.price) || 0
                            }));
                            setLiveAssets(cryptoItems);
                        }
                        break;
                    case 'stock':
                        result = await financeApi.getStockPrices();
                        if (isMounted && result.success && result.data) {
                            const stockItems = result.data.slice(0, 20).map(item => ({
                                id: item.code,
                                name: `${item.text} (${item.code})`,
                                buyPrice: parseFloat(item.lastprice) || 0,
                                sellPrice: parseFloat(item.lastprice) || 0
                            }));
                            setLiveAssets(stockItems);
                        }
                        break;
                    default:
                        setLiveAssets([]);
                }
            } catch (error) {
                console.error('Error fetching live prices:', error);
                setPriceError('Fiyatlar alınamadı');
            } finally {
                setIsLoadingPrices(false);
            }
        };

        fetchLivePrices();
    }, [invType, visible, activeType]);

    // Auto-fill price when asset is selected
    const handleSelectLiveAsset = (asset) => {
        setSelectedLiveAsset(asset);
        setInvName(asset.name);
        setInvPrice(asset.buyPrice.toString());
        // Miktar varsa otomatik hesapla
        const amount = parseFloat(invAmount) || 1;
        setInvEstValue((asset.buyPrice * amount).toFixed(2));
    };

    // Miktar değiştiğinde Toplam Değeri otomatik hesapla
    useEffect(() => {
        if (invPrice && invAmount) {
            const price = parseFloat(invPrice) || 0;
            const amount = parseFloat(invAmount) || 0;
            const total = price * amount;
            setInvEstValue(total > 0 ? total.toFixed(2) : '');
        }
    }, [invAmount, invPrice]);

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Ne eklemek istersiniz?</Text>

            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveType('expense')}>
                <LinearGradient colors={['rgba(239, 68, 68, 0.2)', 'rgba(30, 41, 59, 0.8)']} style={styles.menuGradient}>
                    <Text style={styles.menuIcon}>💸</Text>
                    <Text style={styles.menuLabel}>Harcama Ekle</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveType('income')}>
                <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(30, 41, 59, 0.8)']} style={styles.menuGradient}>
                    <Text style={styles.menuIcon}>💰</Text>
                    <Text style={styles.menuLabel}>Gelir Ekle</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveType('investment')}>
                <LinearGradient colors={['rgba(59, 130, 246, 0.2)', 'rgba(30, 41, 59, 0.8)']} style={styles.menuGradient}>
                    <Text style={styles.menuIcon}>📈</Text>
                    <Text style={styles.menuLabel}>Yeni Yatırım</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderExpenseForm = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Harcama Ekle</Text>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tutar</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 40, color: theme.textPrimary, marginRight: 5 }}>
                        {userSettings.currency === 'USD' ? '$' : userSettings.currency === 'EUR' ? '€' : '₺'}
                    </Text>
                    <TextInput
                        style={[styles.amountInput, { color: theme.textPrimary, borderBottomColor: theme.glassBorder, flex: 1 }]}
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        autoFocus={true}
                        value={expAmount}
                        onChangeText={setExpAmount}
                    />
                </View>

                {/* Date/Time Selection */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => openDatePicker('expense')}>
                        <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '500' }}>
                            📅 {expDate.toLocaleDateString('tr-TR')} {expDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Expense Type Toggle */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Harcama Tipi</Text>
                <View style={{ flexDirection: 'row', backgroundColor: theme.glassBorder, borderRadius: 12, padding: 4 }}>
                    <TouchableOpacity
                        style={[
                            styles.typeToggle,
                            expType === 'daily' && { backgroundColor: theme.accent }
                        ]}
                        onPress={() => setExpType('daily')}
                    >
                        <Text style={[styles.typeToggleText, { color: expType === 'daily' ? 'white' : theme.textSecondary }]}>Günlük Harcama</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.typeToggle,
                            expType === 'variable' && { backgroundColor: theme.accent }
                        ]}
                        onPress={() => setExpType('variable')}
                    >
                        <Text style={[styles.typeToggleText, { color: expType === 'variable' ? 'white' : theme.textSecondary }]}>Değişken Fatura</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Description & AI */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Açıklama</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: theme.glassBorder, color: theme.textPrimary }]}
                    placeholder="Harcama Adı veya Mağaza"
                    placeholderTextColor={theme.textSecondary}
                    value={expDesc}
                    onChangeText={handleDescChange}
                />
                {aiSuggestion && !expCategory && (
                    <TouchableOpacity style={styles.aiSuggestionBox} onPress={confirmAiSuggestion}>
                        <Text style={styles.aiSuggestionText}>✨ Öneri: {aiSuggestion} <Text style={{ fontWeight: 'bold' }}>(Onayla)</Text></Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                    {['🍔 Gıda', '🚕 Ulaşım', '🛒 Market', '🎉 Eğlence', '🏠 Kira', '💡 Fatura'].map((cat, index) => {
                        const catName = cat.split(' ')[1]; // Extract name
                        const isSelected = expCategory === catName || (expCategory === 'Yiyecek & İçecek' && catName === 'Gıda'); // Mapping for demo
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.categoryChip, isSelected && { backgroundColor: theme.accent }, { borderColor: theme.glassBorder, borderWidth: 1 }]}
                                onPress={() => setExpCategory(catName)}
                            >
                                <Text style={[styles.categoryText, { color: isSelected ? 'white' : theme.textSecondary }]}>{cat}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Payment Method */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Ödeme Yöntemi</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodList}>
                    {accounts.map(acc => (
                        <TouchableOpacity
                            key={acc.id}
                            style={[styles.methodChip, expPaymentMethod === acc.id && { backgroundColor: theme.accent, borderColor: theme.accent }, { borderColor: theme.glassBorder }]}
                            onPress={() => setExpPaymentMethod(acc.id)}
                        >
                            <Text style={[styles.methodText, { color: expPaymentMethod === acc.id ? 'white' : theme.textSecondary }]}>{acc.name}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.methodChip, expPaymentMethod === 'cash' && { backgroundColor: theme.accent, borderColor: theme.accent }, { borderColor: theme.glassBorder }]}
                        onPress={() => setExpPaymentMethod('cash')}
                    >
                        <Text style={[styles.methodText, { color: expPaymentMethod === 'cash' ? 'white' : theme.textSecondary }]}>Nakit</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={handleAddExpense}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>

            {/* Advanced Options */}
            <View style={styles.advancedOptions}>
                <TouchableOpacity style={styles.advancedButton} onPress={() => alert('Kamera açılıyor...')}>
                    <Text style={{ fontSize: 20 }}>📷</Text>
                    <Text style={[styles.advancedButtonText, { color: theme.textSecondary }]}>Fiş Ekle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.advancedButton} onPress={() => alert('Konum alınıyor...')}>
                    <Text style={{ fontSize: 20 }}>📍</Text>
                    <Text style={[styles.advancedButtonText, { color: theme.textSecondary }]}>Konum Ekle</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const handleAddIncome = () => {
        const incomeData = {
            name: incSource || 'Gelir',
            amount: parseFloat(incAmount) || 0,
            date: selectedDate.toLocaleDateString('tr-TR'),
            type: incType,
            incomeType: incType === 'regular' ? 'Aktif Gelir' : 'Ek Gelir'
        };

        addIncome(incomeData, incType);
        setIncAmount('');
        setIncSource('');
        setIncType('irregular');
        onClose();
    };

    const renderIncomeForm = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Gelir Ekle</Text>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tutar</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 40, color: theme.textPrimary, marginRight: 5 }}>
                        {userSettings.currency === 'USD' ? '$' : userSettings.currency === 'EUR' ? '€' : '₺'}
                    </Text>
                    <TextInput
                        style={[styles.amountInput, { color: theme.textPrimary, borderBottomColor: theme.glassBorder, flex: 1 }]}
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        autoFocus={true}
                        value={incAmount}
                        onChangeText={setIncAmount}
                    />
                </View>
            </View>

            {/* Source Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Kaynak</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: theme.glassBorder, color: theme.textPrimary }]}
                    placeholder="Örn: Maaş, Prim, Satış"
                    placeholderTextColor={theme.textSecondary}
                    value={incSource}
                    onChangeText={setIncSource}
                />
            </View>

            {/* Income Type Toggle */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Gelir Tipi</Text>
                <View style={{ flexDirection: 'row', backgroundColor: theme.glassBorder, borderRadius: 12, padding: 4 }}>
                    <TouchableOpacity
                        style={[
                            styles.typeToggle,
                            incType === 'regular' && { backgroundColor: theme.accent }
                        ]}
                        onPress={() => setIncType('regular')}
                    >
                        <Text style={[styles.typeToggleText, { color: incType === 'regular' ? 'white' : theme.textSecondary }]}>Düzenli (Maaş vb.)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.typeToggle,
                            incType === 'irregular' && { backgroundColor: theme.accent }
                        ]}
                        onPress={() => setIncType('irregular')}
                    >
                        <Text style={[styles.typeToggleText, { color: incType === 'irregular' ? 'white' : theme.textSecondary }]}>Düzensiz (Ek Gelir)</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Selection */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tarih</Text>
                <TouchableOpacity onPress={() => openDatePicker('income')}>
                    <Text style={{ color: theme.accent, fontSize: 16 }}>📅 {selectedDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={handleAddIncome}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // Dynamic Form Configuration
    const getFormConfig = (type) => {
        switch (type) {
            case 'real_estate':
                return {
                    nameLabel: 'Mülk Adı / Adres',
                    namePlaceholder: 'Örn: Kadıköy Daire Kira Amaçlı',
                    amountLabel: 'Adet (Opsiyonel)',
                    amountPlaceholder: 'Örn: 1',
                    priceLabel: 'Toplam Alış Fiyatı',
                    pricePlaceholder: 'Örn: ₺2.500.000',
                    valueLabel: 'Güncel Piyasa Değeri (Manuel)',
                    valuePlaceholder: 'Örn: ₺3.200.000'
                };
            case 'fund':
                return {
                    nameLabel: 'Fon Adı / Kodu',
                    namePlaceholder: 'Örn: AFT (Aktif Fon)',
                    amountLabel: 'Adet',
                    amountPlaceholder: 'Örn: 12.500',
                    priceLabel: 'Birim Alış Fiyatı',
                    pricePlaceholder: 'Örn: ₺0.18',
                    valueLabel: 'Güncel Birim Fiyatı',
                    valuePlaceholder: 'Örn: ₺0.25'
                };
            case 'crypto':
                return {
                    nameLabel: 'Kripto Varlık',
                    namePlaceholder: 'Örn: BTC, ETH veya AVAX',
                    amountLabel: 'Miktar',
                    amountPlaceholder: 'Örn: 0.05',
                    priceLabel: 'Toplam Alış Maliyeti',
                    pricePlaceholder: 'Örn: ₺120.000',
                    valueLabel: 'Güncel Toplam Değer',
                    valuePlaceholder: 'Örn: ₺155.000'
                };
            case 'stock':
                return {
                    nameLabel: 'Hisse Kodu',
                    namePlaceholder: 'Örn: THYAO, TUPRS',
                    amountLabel: 'Lot Adedi',
                    amountPlaceholder: 'Örn: 100',
                    priceLabel: 'Ortalama Maliyet',
                    pricePlaceholder: 'Örn: ₺250.50',
                    valueLabel: 'Güncel Fiyat',
                    valuePlaceholder: 'Örn: ₺275.00'
                };
            case 'gold':
                return {
                    amountLabel: 'Gram Miktarı',
                    amountPlaceholder: 'Örn: 10 Gram',
                    priceLabel: 'Alış Fiyatı (Gram)',
                    pricePlaceholder: 'Örn: ₺2.450',
                };
            case 'currency':
                return {
                    amountLabel: 'Miktar',
                    amountPlaceholder: 'Örn: $1000',
                    priceLabel: 'Ortalama Kur',
                    pricePlaceholder: 'Örn: ₺32.50',
                };
            default:
                return {
                    nameLabel: 'Varlık Adı',
                    namePlaceholder: 'Örn: Yatırım',
                    amountLabel: 'Miktar',
                    amountPlaceholder: 'Örn: 1',
                    priceLabel: 'Maliyet',
                    pricePlaceholder: '₺0',
                    valueLabel: 'Güncel Değer',
                    valuePlaceholder: '₺0'
                };
        }
    };

    const formConfig = getFormConfig(invType);

    const handlePreAddAsset = () => {
        // Calculate Total Cost to show in alert
        const amountVal = parseFloat(invAmount);
        const priceVal = parseFloat(invPrice);

        let totalCost = 0;
        if (invType === 'stock' || invType === 'fund' || invType === 'gold' || invType === 'currency') {
            const amountNum = parseFloat(invAmount.replace(/[^0-9.]/g, '')) || 0;
            totalCost = amountNum * (parseFloat(invPrice) || 0);
        } else {
            totalCost = parseFloat(invPrice) || 0;
        }

        setAlertConfig({
            title: 'Ödeme Kaynağı Seçin',
            message: `Bu yatırım (${formatCurrency(totalCost)}) için ödemeyi nereden yapmak istersiniz?`,
            buttons: [
                {
                    text: 'Bütçeden Öde',
                    style: 'default',
                    onPress: () => executeAddAsset('budget', totalCost)
                },
                {
                    text: 'Nakitten Öde (Varlık)',
                    style: 'default',
                    onPress: () => executeAddAsset('asset', totalCost)
                },
                {
                    text: 'Varolan Yatırım (Cüzdan/Kumbara)',
                    style: 'default',
                    onPress: () => executeAddAsset('existing', totalCost)
                },
                {
                    text: 'İptal',
                    style: 'cancel',
                    onPress: () => setAlertVisible(false)
                }
            ]
        });
        setAlertVisible(true);
    };

    const executeAddAsset = (source, totalCost) => {
        const newAsset = {
            name: invName || (invType === 'gold' ? 'Gram Altın' : invType === 'currency' ? 'Amerikan Doları' : 'Varlık'),
            amount: invAmount,
            avgCost: parseFloat(invPrice) || 0,
            currentPrice: parseFloat(invEstValue) || ((parseFloat(invPrice) || 0) * (invType === 'stock' || invType === 'fund' ? 1 : 1)),
            type: invType,
            color: invType === 'gold' ? COLORS.accentYellow : invType === 'currency' ? COLORS.accentBlue : invType === 'stock' ? COLORS.accentGreen : invType === 'crypto' ? '#f7931a' : '#8b5cf6',
            lastUpdated: new Date().toISOString()
        };
        addAsset(newAsset);

        if (source === 'budget') {
            // 1. Add Transaction
            addTransaction({
                id: Date.now(),
                name: `${newAsset.name} Alımı`,
                amount: totalCost,
                category: 'Yatırım',
                date: 'Bugün',
                icon: '💰',
                timestamp: new Date().toISOString()
            });

            // 2. Add to Assets Total Value
            addToAssets(totalCost);

            setAlertConfig({
                title: 'Başarılı',
                message: 'Yatırım portföye eklendi ve bütçeden düşüldü.',
                buttons: [{ text: 'Tamam', onPress: () => { setAlertVisible(false); onClose(); } }]
            });
        } else if (source === 'existing') {
            // Existing Asset: Increase Total Asset Value, NO Transaction
            addToAssets(totalCost);

            setAlertConfig({
                title: 'Başarılı',
                message: 'Yatırım portföye eklendi. (Varolan varlık olarak işlendi, bütçe etkilenmedi)',
                buttons: [{ text: 'Tamam', onPress: () => { setAlertVisible(false); onClose(); } }]
            });
        } else {
            // Source = Asset (Liquid Cash to Asset)
            // Ideally should deduct from Cash Account here, but for now just add to List (Net Worth doesn't change)

            setAlertConfig({
                title: 'Başarılı',
                message: 'Yatırım portföye eklendi. (Nakit varlık değişimi, bütçe etkilenmedi)',
                buttons: [{ text: 'Tamam', onPress: () => { setAlertVisible(false); onClose(); } }]
            });
        }
        setAlertVisible(true);
    };

    const renderInvestmentForm = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Yatırım Ekle</Text>

            {/* Asset Type Selector */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Yatırım Türü</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {[
                        { id: 'gold', label: 'Altın', icon: '🟡' },
                        { id: 'currency', label: 'Döviz', icon: '💵' },
                        { id: 'stock', label: 'Hisse', icon: '📈' },
                        { id: 'crypto', label: 'Kripto', icon: '₿' },
                        { id: 'fund', label: 'Fon', icon: '📊' },
                        { id: 'real_estate', label: 'Emlak', icon: '🏠' },
                    ].map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.typeChip, invType === type.id && styles.activeTypeChip, { borderColor: invType === type.id ? COLORS.accentBlue : theme.glassBorder }]}
                            onPress={() => setInvType(type.id)}
                        >
                            <Text style={{ fontSize: 16, marginRight: 5 }}>{type.icon}</Text>
                            <Text style={[styles.typeText, invType === type.id && { color: 'white', fontWeight: 'bold' }, { color: theme.textSecondary }]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Live Asset Picker - for gold, currency, crypto, stock */}
            {(invType === 'gold' || invType === 'currency' || invType === 'crypto' || invType === 'stock') && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Varlık Seçin {isLoadingPrices && <ActivityIndicator size="small" color={theme.accent} />}
                    </Text>
                    {priceError && (
                        <Text style={{ color: COLORS.accentRed, fontSize: 12, marginBottom: 8 }}>⚠️ {priceError}</Text>
                    )}
                    {liveAssets.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                            {liveAssets.map(asset => (
                                <TouchableOpacity
                                    key={asset.id}
                                    style={[
                                        styles.typeChip,
                                        selectedLiveAsset?.id === asset.id && styles.activeTypeChip,
                                        { borderColor: selectedLiveAsset?.id === asset.id ? COLORS.accentGreen : theme.glassBorder }
                                    ]}
                                    onPress={() => handleSelectLiveAsset(asset)}
                                >
                                    <View>
                                        <Text style={[styles.typeText, { color: selectedLiveAsset?.id === asset.id ? 'white' : theme.textPrimary, fontWeight: '600' }]}>
                                            {asset.name}
                                        </Text>
                                        <Text style={{ color: COLORS.accentGreen, fontSize: 11, marginTop: 2 }}>
                                            Alış: {formatCurrency(asset.buyPrice)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    {selectedLiveAsset && (
                        <View style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
                            <Text style={{ color: COLORS.accentGreen, fontWeight: '600' }}>
                                ✓ Seçili: {selectedLiveAsset.name}
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                                Canlı Alış Fiyatı: {formatCurrency(selectedLiveAsset.buyPrice)}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Dynamic Fields */}
            {(invType === 'stock' || invType === 'crypto' || invType === 'fund' || invType === 'real_estate') && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>{formConfig.nameLabel}</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.glassBorder, color: theme.textPrimary }]}
                        placeholder={formConfig.namePlaceholder}
                        placeholderTextColor={theme.textSecondary}
                        value={invName}
                        onChangeText={setInvName}
                    />
                </View>
            )}

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{formConfig.amountLabel}</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: theme.glassBorder, color: theme.textPrimary }]}
                    placeholder={formConfig.amountPlaceholder}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={invAmount}
                    onChangeText={setInvAmount}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{formConfig.priceLabel}</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: theme.glassBorder, color: theme.textPrimary }]}
                    placeholder={formConfig.pricePlaceholder}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={invPrice}
                    onChangeText={setInvPrice}
                />
            </View>

            {/* Real Estate / Crypto / Fund Specific: Estimated Value - Otomatik Hesaplanır */}
            {(invType === 'real_estate' || invType === 'crypto' || invType === 'fund') && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>{formConfig.valueLabel}</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: COLORS.accentGreen, fontWeight: '600' }]}
                        placeholder="Otomatik hesaplanacak"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={invEstValue}
                        editable={false}
                    />
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>✓ Miktar × Birim Fiyat = Toplam Değer</Text>
                </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handlePreAddAsset}>
                <Text style={styles.saveButtonText}>Portföye Ekle</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const handleDateSelect = (date) => {
        if (dateField === 'expense') {
            setExpDate(date);
        } else {
            setSelectedDate(date);
        }
        setDatePickerVisible(false);
    };

    const openDatePicker = (field) => {
        setDateField(field);
        setDatePickerVisible(true);
    };

    const handleAddRegularPayment = () => {
        const day = selectedDate.getDate();
        let estDescription = '';

        if (regFreq === 'Aylık') {
            estDescription = `Her ayın ${day}'i`;
        } else if (regFreq === 'Haftalık') {
            const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
            estDescription = `Her ${days[selectedDate.getDay()]}`;
        } else {
            const month = selectedDate.toLocaleString('tr-TR', { month: 'long' });
            estDescription = `Her yıl ${day} ${month}`;
        }

        addRecurringPayment({
            name: regName || 'Düzenli Ödeme',
            amount: parseFloat(regAmount) || 0,
            date: estDescription,
            est: `Tahmini: ₺${regAmount}`,
            type: regType
        });
        onClose();
    };

    const handleAddExtraPayment = () => {
        addExtraPayment({
            name: extraName || 'Ek Ödeme',
            amount: parseFloat(extraAmount) || 0,
            date: selectedDate.toLocaleDateString('tr-TR'), // Using selected date
            type: 'extra'
        });
        onClose();
    };

    const renderMiniMenuOverlay = () => {
        if (!miniMenuVisible) return null;
        return (
            <TouchableOpacity
                style={styles.miniMenuOverlay}
                activeOpacity={1}
                onPress={() => setMiniMenuVisible(false)}
            >
                <View style={[styles.miniMenu, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setMiniMenuVisible(false); setActiveType('regular_payment'); }}>
                        <Text style={styles.miniMenuIcon}>📅</Text>
                        <Text style={[styles.miniMenuText, { color: theme.textPrimary }]}>Düzenli Ödeme Başlat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setMiniMenuVisible(false); setActiveType('extra_payment'); }}>
                        <Text style={styles.miniMenuIcon}>💸</Text>
                        <Text style={[styles.miniMenuText, { color: theme.textPrimary }]}>Ek Ödeme Kaydet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setMiniMenuVisible(false); setActiveType('income'); }}>
                        <Text style={styles.miniMenuIcon}>💰</Text>
                        <Text style={[styles.miniMenuText, { color: theme.textPrimary }]}>Gelir Ekle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setMiniMenuVisible(false); setActiveType('investment'); }}>
                        <Text style={styles.miniMenuIcon}>📈</Text>
                        <Text style={[styles.miniMenuText, { color: theme.textPrimary }]}>Yatırım Girişi</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderRegularPaymentForm = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Düzenli Ödeme</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Ödeme Adı</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: theme.glassBorder, color: theme.textPrimary }]}
                    placeholder="Örn: Kira, Netflix"
                    placeholderTextColor={theme.textSecondary}
                    value={regName}
                    onChangeText={setRegName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tutar</Text>
                <TextInput
                    style={[styles.amountInput, { color: theme.textPrimary, borderBottomColor: theme.glassBorder }]}
                    placeholder="₺0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={regAmount}
                    onChangeText={setRegAmount}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Kategori</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                        { id: 'fixed', label: 'Sabit' },
                        { id: 'variable', label: 'Değişken' },
                        { id: 'subscription', label: 'Abonelik' }
                    ].map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.categoryChip, regType === type.id && { backgroundColor: theme.accent }, { borderColor: theme.glassBorder, borderWidth: 1 }]}
                            onPress={() => setRegType(type.id)}
                        >
                            <Text style={[styles.categoryText, { color: regType === type.id ? 'white' : theme.textSecondary }]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Sıklık</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {['Aylık', 'Yıllık'].map(freq => (
                        <TouchableOpacity
                            key={freq}
                            style={[styles.categoryChip, regFreq === freq && { backgroundColor: theme.accent }, { borderColor: theme.glassBorder, borderWidth: 1 }]}
                            onPress={() => setRegFreq(freq)}
                        >
                            <Text style={[styles.categoryText, { color: regFreq === freq ? 'white' : theme.textSecondary }]}>{freq}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Başlangıç Tarihi</Text>
                <TouchableOpacity onPress={() => openDatePicker('regular')}>
                    <Text style={{ color: theme.accent, fontSize: 16 }}>📅 {selectedDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={handleAddRegularPayment}>
                <Text style={styles.saveButtonText}>Başlat</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderExtraPaymentForm = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Ek Ödeme Kaydet</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Açıklama</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: theme.glassBorder, color: theme.textPrimary }]}
                    placeholder="Örn: Araba Tamiri"
                    placeholderTextColor={theme.textSecondary}
                    value={extraName}
                    onChangeText={setExtraName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tutar</Text>
                <TextInput
                    style={[styles.amountInput, { color: theme.textPrimary, borderBottomColor: theme.glassBorder }]}
                    placeholder="₺0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={extraAmount}
                    onChangeText={setExtraAmount}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tarih</Text>
                <TouchableOpacity onPress={() => openDatePicker('extra')}>
                    <Text style={{ color: theme.accent, fontSize: 16 }}>📅 {selectedDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={handleAddExtraPayment}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // Reset state when modal opens
    React.useEffect(() => {
        if (visible) {
            setActiveType(null);
            setMiniMenuVisible(false);
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={[styles.container, { backgroundColor: 'transparent' }]}>
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Text style={[styles.closeText, { color: theme.textSecondary }]}>Kapat</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {activeType === 'expense' && (
                            <TouchableOpacity onPress={() => setMiniMenuVisible(true)} style={styles.optionsButton}>
                                <Text style={{ fontSize: 24, color: theme.textPrimary, fontWeight: 'bold', marginTop: -10 }}>...</Text>
                            </TouchableOpacity>
                        )}

                        {activeType && (
                            <TouchableOpacity onPress={() => setActiveType(null)} style={styles.backButton}>
                                <Text style={styles.backText}>Geri</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {!activeType && renderMenu()}
                {activeType === 'expense' && renderExpenseForm()}
                {activeType === 'income' && renderIncomeForm()}
                {activeType === 'investment' && renderInvestmentForm()}
                {activeType === 'regular_payment' && renderRegularPaymentForm()}
                {activeType === 'extra_payment' && renderExtraPaymentForm()}

                {renderMiniMenuOverlay()}

                <CustomDatePicker
                    visible={datePickerVisible}
                    onClose={() => setDatePickerVisible(false)}
                    onSelect={handleDateSelect}
                    title="Tarih Seç"
                    initialDate={selectedDate}
                />

                <CustomAlert
                    visible={alertVisible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    buttons={alertConfig.buttons}
                    onClose={() => setAlertVisible(false)}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        zIndex: 10,
    },
    closeButton: {
        padding: 10,
    },
    closeText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        color: COLORS.accentBlue,
        fontSize: 16,
    },
    menuContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 20,
        paddingBottom: 100,
    },
    menuTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    menuItem: {
        height: 80,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 15,
    },
    menuIcon: {
        fontSize: 32,
    },
    menuLabel: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    formContainer: {
        paddingTop: 20,
    },
    formTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 10,
    },
    amountInput: {
        fontSize: 40,
        color: 'white',
        fontWeight: '700',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glassBorder,
        paddingBottom: 10,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        color: 'white',
        fontSize: 16,
    },
    categoryList: {
        flexDirection: 'row',
    },
    categoryChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
    },
    categoryText: {
        color: 'white',
        fontSize: 14,
    },
    aiHint: {
        color: COLORS.accentYellow,
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    methodChip: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        marginRight: 10,
    },
    activeMethod: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: COLORS.accentBlue,
    },
    methodText: {
        color: COLORS.textSecondary,
    },
    methodTextActive: {
        color: COLORS.accentBlue,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: COLORS.accentBlue,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 50,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    typeToggle: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    typeToggleText: {
        fontWeight: '600',
        fontSize: 14,
    },
    aiSuggestionBox: {
        marginTop: 8,
        padding: 10,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.accentBlue,
    },
    aiSuggestionText: {
        color: COLORS.accentBlue,
        fontSize: 14,
    },
    methodList: {
        flexDirection: 'row',
    },
    advancedOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        marginBottom: 30,
    },
    advancedButton: {
        alignItems: 'center',
        padding: 10,
    },
    advancedButtonText: {
        fontSize: 12,
        marginTop: 5,
    },
    typeScroll: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    activeTypeChip: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
    },
    typeText: {
        fontSize: 14,
    },
    optionsButton: {
        padding: 10,
        marginRight: 10,
    },
    miniMenuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 100,
        paddingRight: 20,
        zIndex: 1000,
    },
    miniMenu: {
        width: 220,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    miniMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    miniMenuIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    miniMenuText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default QuickAddModal;
