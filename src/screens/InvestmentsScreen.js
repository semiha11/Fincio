import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { DataContext } from '../context/DataContext';
import CustomAlert from '../components/CustomAlert';
import * as financeApi from '../services/financeApi';

const InvestmentsScreen = ({ scrollViewRef }) => {
    const { goals, savingsPotential, theme, formatCurrency, assets, deleteAsset, formatDate, updateAssetAmount, addTransaction, addToAssets, addIncome } = useContext(DataContext);

    // Live Finance Data State
    const [liveData, setLiveData] = useState({ gold: [], exchange: [], crypto: [], stocks: [] });
    const [isLoadingPrices, setIsLoadingPrices] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null); // Sessiz uyarı mesajı
    const [lastUpdated, setLastUpdated] = useState(null);

    // Fetch live prices on mount
    useEffect(() => {
        let isMounted = true;

        const fetchLivePrices = async () => {
            if (!isMounted) return;
            setIsLoadingPrices(true);
            try {
                const data = await financeApi.getAllFinanceData();
                if (isMounted) {
                    setLiveData(data);
                    setLastUpdated(new Date());
                    setStatusMessage(data.statusMessage || null);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching live prices:', error);
                    setStatusMessage('Veriler şu an güncellenemiyor');
                }
            } finally {
                if (isMounted) setIsLoadingPrices(false);
            }
        };

        fetchLivePrices();

        // Refresh every 5 minutes
        const interval = setInterval(fetchLivePrices, 5 * 60 * 1000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // Use the first goal for the main display or a summary of goals
    const primaryGoal = goals.length > 0 ? goals[0] : { name: 'Hedef Yok', saved: 0, target: 1000 };

    // State for interactivity
    const [timeRange, setTimeRange] = React.useState('1G'); // 1G, 1H, 1A, TÜM
    const [selectedAssetType, setSelectedAssetType] = React.useState(null); // null = all
    const [expandedAssetId, setExpandedAssetId] = React.useState(null); // For "Manage" options

    // Trade State
    const [tradeModalVisible, setTradeModalVisible] = React.useState(false);
    const [tradeConfig, setTradeConfig] = React.useState({ type: 'buy', asset: null });
    const [tradeAmount, setTradeAmount] = React.useState('');

    // Calculate Portfolio Data from Assets
    const calculateTotalValue = () => {
        return assets.reduce((sum, asset) => {
            // Extract number from amount string
            const amountStr = asset.amount ? asset.amount.toString() : '0';
            const amountNum = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 1;

            // Handle different asset types
            if (asset.type === 'real_estate') return sum + asset.currentPrice;
            if (asset.type === 'currency' && asset.amount.includes('$')) return sum + (amountNum * 32); // Mock rate for demo

            // Default: amount * price
            return sum + (amountNum * asset.currentPrice);
        }, 0);
    };

    const totalAssetValue = calculateTotalValue();

    // Mock Data - Dynamic based on timeRange
    const getPortfolioData = () => {
        const currentVal = totalAssetValue; // Use REAL Value

        switch (timeRange) {
            case '1G': return { value: currentVal, change: currentVal * 0.005, percent: 0.5 };
            case '1H': return { value: currentVal, change: currentVal * 0.019, percent: 1.9 };
            case '1A': return { value: currentVal, change: currentVal * 0.051, percent: 5.1 };
            case 'TÜM': return { value: currentVal, change: currentVal * 0.496, percent: 49.6 };
            default: return { value: currentVal, change: 0, percent: 0 };
        }
    };
    const portfolioData = getPortfolioData();

    // Assets are now from DataContext

    const filteredAssets = selectedAssetType ? assets.filter(a => a.type === selectedAssetType) : assets;

    // Alert State
    const [alertVisible, setAlertVisible] = React.useState(false);
    const [alertConfig, setAlertConfig] = React.useState({ title: '', message: '', buttons: [] });

    // Helper: Get live price for an asset from API data
    const getLivePrice = (asset) => {
        if (!asset || !liveData) return null;

        const assetName = (asset.name || '').toLowerCase();
        const assetType = asset.type;

        try {
            switch (assetType) {
                case 'gold':
                    const goldItem = liveData.gold?.find(g =>
                        assetName.includes(g.name?.toLowerCase()) ||
                        g.name?.toLowerCase().includes(assetName.split(' ')[0])
                    );
                    return goldItem ? parseFloat(goldItem.buying) || parseFloat(goldItem.selling) : null;

                case 'currency':
                    const currencyItem = liveData.exchange?.find(c =>
                        assetName.includes(c.code?.toLowerCase()) ||
                        assetName.includes(c.name?.toLowerCase())
                    );
                    return currencyItem ? parseFloat(currencyItem.buying) : null;

                case 'crypto':
                    const cryptoItem = liveData.crypto?.find(c =>
                        assetName.includes(c.code?.toLowerCase()) ||
                        assetName.includes(c.name?.toLowerCase())
                    );
                    return cryptoItem ? parseFloat(cryptoItem.price) : null;

                case 'stock':
                    const stockItem = liveData.stocks?.find(s =>
                        assetName.includes(s.code?.toLowerCase()) ||
                        s.text?.toLowerCase().includes(assetName)
                    );
                    return stockItem ? parseFloat(stockItem.lastprice) : null;

                default:
                    return null;
            }
        } catch (error) {
            console.error('Error getting live price:', error);
            return null;
        }
    };

    // Calculate profit/loss with live prices
    const calculateAssetProfitLoss = (asset) => {
        const livePrice = getLivePrice(asset);
        const currentPrice = livePrice || asset.currentPrice;
        const avgCost = asset.avgCost || 0;

        const amountStr = asset.amount ? asset.amount.toString() : '1';
        const amountNum = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 1;

        const totalCost = avgCost * amountNum;
        const totalValue = currentPrice * amountNum;
        const profitLoss = currentPrice - avgCost;
        const totalProfitLoss = totalValue - totalCost;
        const percentage = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;

        return {
            livePrice,
            currentPrice,
            profitLoss,
            totalProfitLoss,
            percentage: percentage.toFixed(2),
            isProfit: profitLoss >= 0,
            hasLiveData: livePrice !== null
        };
    };

    const handleTrade = (type, asset) => {
        setTradeConfig({ type, asset });
        setTradeAmount('');
        setTradeModalVisible(true);
    };

    const handlePreTrade = () => {
        if (!tradeAmount || isNaN(tradeAmount)) {
            setAlertConfig({
                title: 'Hata',
                message: 'Lütfen geçerli bir miktar girin.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }

        // Close trade modal first
        setTradeModalVisible(false);

        if (tradeConfig.type === 'buy') {
            // Ask for Source
            setTimeout(() => {
                setAlertConfig({
                    title: 'Ödeme Kaynağı Seçin',
                    message: `Bu alım için ödemeyi nereden yapmak istersiniz?`,
                    buttons: [
                        {
                            text: 'Varlıklardan Öde',
                            style: 'default',
                            onPress: () => executeTrade('asset')
                        },
                        {
                            text: 'Bütçeden Öde',
                            style: 'default',
                            onPress: () => executeTrade('budget')
                        },
                        {
                            text: 'İptal',
                            style: 'cancel',
                            onPress: () => setAlertVisible(false)
                        }
                    ]
                });
                setAlertVisible(true);
            }, 500);
        } else {
            // Sell logic usually adds to budget/income, no source needed? 
            // Or maybe user wants to keep it in assets (Cash)?
            // For now, keep existing sell logic but wrapped in delay
            setTimeout(() => executeTrade('sell_default'), 500);
        }
    };

    const executeTrade = (source) => {
        const amountNum = parseFloat(tradeAmount);
        const totalCost = amountNum * tradeConfig.asset.currentPrice;

        updateAssetAmount(tradeConfig.asset.id, tradeAmount, tradeConfig.type);

        if (tradeConfig.type === 'buy') {
            if (source === 'budget') {
                // 1. Add Transaction (Expense)
                addTransaction({
                    id: Date.now(),
                    name: `${tradeConfig.asset.name} Alımı`,
                    amount: totalCost,
                    category: 'Yatırım',
                    date: 'Bugün',
                    icon: '💰',
                    timestamp: new Date().toISOString()
                });

                // 2. Update Net Worth (Add to Assets) -> Because money came from outside assets
                addToAssets(totalCost);

                setAlertConfig({
                    title: 'Başarılı',
                    message: `${tradeConfig.asset.name} alımı yapıldı.\nTutar (${formatCurrency(totalCost)}) bütçenizden düşüldü ve varlıklarınıza eklendi.`,
                    buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
                });
            } else {
                // source === 'asset'
                // Money came from existing assets (Cash -> Asset). Total Asset Value unchanged (theoretically).
                // So we do NOT call addToAssets(totalCost).
                // We do NOT add expense transaction.

                setAlertConfig({
                    title: 'Başarılı',
                    message: `${tradeConfig.asset.name} alımı yapıldı.\nTutar (${formatCurrency(totalCost)}) mevcut varlıklarınız (Nakit) kullanılarak karşılandı. Toplam varlık değeri değişmedi.`,
                    buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
                });
            }
            setAlertVisible(true);

        } else {
            // Sell Logic (unchanged mostly)
            // 1. Add to Irregular Income
            addIncome({
                name: `${tradeConfig.asset.name} Satışı`,
                amount: totalCost,
                date: 'Bugün',
                incomeType: 'Ek Gelir'
            }, 'irregular');

            // 2. Decrease Asset Value from Total
            addToAssets(-totalCost);

            setAlertConfig({
                title: 'Başarılı',
                message: `${tradeConfig.asset.name} satışı yapıldı.\nTutar (${formatCurrency(totalCost)}) bütçenize eklendi.`,
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
        }
    };

    const renderPortfolioSummary = () => (
        <View style={styles.summaryContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Portföy Özeti</Text>
                <View style={styles.timeRangeContainer}>
                    {['1G', '1H', '1A', 'TÜM'].map(range => (
                        <TouchableOpacity key={range} onPress={() => setTimeRange(range)} style={[styles.timeRangeButton, timeRange === range && { backgroundColor: theme.accent }]}>
                            <Text style={[styles.timeRangeText, { color: timeRange === range ? 'white' : theme.textSecondary }]}>{range}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Sessiz Durum Mesajı - Küçük Uyarı Banner */}
            {statusMessage && (
                <View style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <Text style={{ color: '#fbbf24', fontSize: 11 }}>ℹ️ {statusMessage}</Text>
                </View>
            )}

            <TouchableOpacity onPress={() => {
                const nextRange = timeRange === '1G' ? '1H' : timeRange === '1H' ? '1A' : timeRange === '1A' ? 'TÜM' : '1G';
                setTimeRange(nextRange);
            }}>
                <View style={styles.valueContainer}>
                    <Text style={[styles.totalValue, { color: theme.textPrimary }]}>{formatCurrency(portfolioData.value)}</Text>
                    <View style={styles.changeContainer}>
                        <Text style={[styles.changeText, { color: portfolioData.change >= 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
                            {portfolioData.change >= 0 ? '+' : ''}{formatCurrency(portfolioData.change)} ({portfolioData.change >= 0 ? '+' : ''}{portfolioData.percent}%)
                        </Text>
                        <Text style={[styles.arrowIcon, { color: portfolioData.change >= 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
                            {portfolioData.change >= 0 ? '▲' : '▼'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Area Chart Mock */}
            <View style={styles.chartContainer}>
                <Svg height="120" width="100%" viewBox="0 0 300 120">
                    <Defs>
                        <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={theme.accent} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
                        </SvgLinearGradient>
                    </Defs>
                    <Path
                        d="M0,100 C50,90 100,110 150,60 C200,10 250,40 300,20 L300,120 L0,120 Z"
                        fill="url(#grad)"
                    />
                    <Path
                        d="M0,100 C50,90 100,110 150,60 C200,10 250,40 300,20"
                        fill="none"
                        stroke={theme.accent}
                        strokeWidth="3"
                    />
                </Svg>
            </View>

            {/* Allocation Donut Mock */}
            <View style={[styles.allocationContainer, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.subTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Varlık Dağılımı</Text>
                    {selectedAssetType && (
                        <TouchableOpacity onPress={() => setSelectedAssetType(null)}>
                            <Text style={{ color: theme.accent, fontSize: 12 }}>Filtreyi Temizle</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.donutRow}>
                    <Svg height="100" width="100" viewBox="0 0 100 100">
                        <Circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                        {/* Simplified Donut: Just showing main categories for visual mock */}
                        <Circle onPress={() => setSelectedAssetType('gold')} cx="50" cy="50" r="40" stroke={COLORS.accentYellow} strokeWidth="10" fill="none" strokeDasharray="60 251" strokeLinecap="round" rotation="-90" origin="50, 50" />
                        <Circle onPress={() => setSelectedAssetType('currency')} cx="50" cy="50" r="40" stroke={COLORS.accentBlue} strokeWidth="10" fill="none" strokeDasharray="50 251" strokeDashoffset="-60" strokeLinecap="round" rotation="-90" origin="50, 50" />
                        <Circle onPress={() => setSelectedAssetType('stock')} cx="50" cy="50" r="40" stroke={COLORS.accentGreen} strokeWidth="10" fill="none" strokeDasharray="40 251" strokeDashoffset="-110" strokeLinecap="round" rotation="-90" origin="50, 50" />
                        <Circle onPress={() => setSelectedAssetType('crypto')} cx="50" cy="50" r="40" stroke="#f7931a" strokeWidth="10" fill="none" strokeDasharray="30 251" strokeDashoffset="-150" strokeLinecap="round" rotation="-90" origin="50, 50" />
                        <Circle onPress={() => setSelectedAssetType('real_estate')} cx="50" cy="50" r="40" stroke="#8b5cf6" strokeWidth="10" fill="none" strokeDasharray="40 251" strokeDashoffset="-180" strokeLinecap="round" rotation="-90" origin="50, 50" />
                    </Svg>
                    <View style={styles.legendContainer}>
                        <TouchableOpacity onPress={() => setSelectedAssetType(selectedAssetType === 'gold' ? null : 'gold')}>
                            <Text style={[styles.legendItem, { color: COLORS.accentYellow, opacity: selectedAssetType && selectedAssetType !== 'gold' ? 0.3 : 1 }]}>🟡 Altın</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedAssetType(selectedAssetType === 'currency' ? null : 'currency')}>
                            <Text style={[styles.legendItem, { color: COLORS.accentBlue, opacity: selectedAssetType && selectedAssetType !== 'currency' ? 0.3 : 1 }]}>🔵 Döviz</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedAssetType(selectedAssetType === 'stock' ? null : 'stock')}>
                            <Text style={[styles.legendItem, { color: COLORS.accentGreen, opacity: selectedAssetType && selectedAssetType !== 'stock' ? 0.3 : 1 }]}>🟢 Hisse</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedAssetType(selectedAssetType === 'crypto' ? null : 'crypto')}>
                            <Text style={[styles.legendItem, { color: '#f7931a', opacity: selectedAssetType && selectedAssetType !== 'crypto' ? 0.3 : 1 }]}>₿ Kripto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedAssetType(selectedAssetType === 'real_estate' ? null : 'real_estate')}>
                            <Text style={[styles.legendItem, { color: '#8b5cf6', opacity: selectedAssetType && selectedAssetType !== 'real_estate' ? 0.3 : 1 }]}>🏠 Emlak</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderAssetList = () => (
        <View style={styles.sectionContainer}>
            <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>Varlıklarım {selectedAssetType ? `(${selectedAssetType})` : ''}</Text>
            {filteredAssets.map(asset => {
                const profit = (asset.currentPrice - asset.avgCost);
                const isProfit = profit >= 0;
                const isExpanded = expandedAssetId === asset.id;

                return (
                    <TouchableOpacity
                        key={asset.id}
                        activeOpacity={0.9}
                        onPress={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                    >
                        <BlurView intensity={20} tint="dark" style={[styles.assetCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                            <View style={styles.assetHeader}>
                                <Text style={[styles.assetName, { color: theme.textPrimary }]}>{asset.name}</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.assetAmount, { color: theme.textSecondary }]}>{asset.amount}</Text>
                                    {asset.lastUpdated && (
                                        <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 2 }}>
                                            🕒 {formatDate(asset.lastUpdated)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.assetDetails}>
                                <View>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{asset.type === 'real_estate' ? 'Alış Fiyatı' : 'Ort. Alış'}</Text>
                                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{formatCurrency(asset.avgCost)}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{asset.type === 'real_estate' ? 'Tahmini Değer' : 'Fiyat'}</Text>
                                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{formatCurrency(asset.currentPrice)}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>K/Z</Text>
                                    <Text style={[styles.detailValue, { color: isProfit ? COLORS.accentGreen : COLORS.accentRed }]}>
                                        {isProfit ? '+' : ''}{formatCurrency(profit)}
                                    </Text>
                                </View>
                            </View>

                            {isExpanded && (
                                <View style={styles.assetActions}>
                                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.accentGreen }]} onPress={() => handleTrade('buy', asset)}>
                                        <Text style={styles.actionButtonText}>Alım Ekle</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.accentRed }]} onPress={() => handleTrade('sell', asset)}>
                                        <Text style={styles.actionButtonText}>Satış Ekle</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={() => deleteAsset(asset.id)}>
                                        <Text style={[styles.actionButtonText, { color: COLORS.accentRed }]}>Sil</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </BlurView>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderAnalysis = () => (
        <View style={styles.sectionContainer}>
            <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>Analiz ve Hedefler</Text>

            {/* Risk Warning */}
            <TouchableOpacity onPress={() => {
                setAlertConfig({
                    title: 'Risk Analizi',
                    message: `Portföyünüzün %60'ı yüksek riskli varlıklardan (Kripto, Hisse) oluşuyor.\nÇeşitlendirme yaparak riski düşürebilirsiniz.`,
                    buttons: [{ text: 'Anlaşıldı', onPress: () => setAlertVisible(false) }]
                });
                setAlertVisible(true);
            }}>
                <View style={[styles.adviceCard, { backgroundColor: theme.cardBg, borderColor: COLORS.accentRed }]}>
                    <Text style={{ fontSize: 24, marginRight: 15 }}>⚠️</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.adviceTitle, { color: theme.textPrimary }]}>Yüksek Risk Uyarısı</Text>
                        <Text style={[styles.adviceText, { color: theme.textSecondary }]}>Portföyünüzün %60'ı yüksek riskli...</Text>
                    </View>
                    <Text style={{ color: COLORS.accentRed, fontSize: 20 }}>›</Text>
                </View>
            </TouchableOpacity>

            <View style={[styles.adviceCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                <Text style={{ fontSize: 24, marginRight: 15 }}>💡</Text>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.adviceTitle, { color: theme.textPrimary }]}>Fırsat: BIST 100</Text>
                    <Text style={[styles.adviceText, { color: theme.textSecondary }]}>Borsa İstanbul son 1 ayda %10 değer kazandı.</Text>
                </View>
                <TouchableOpacity style={[styles.applyAdviceButton, { borderColor: theme.accent }]} onPress={() => {
                    setAlertConfig({
                        title: 'İşlem Başlatılıyor',
                        message: 'BIST fonları için alım ekranına yönlendiriliyorsunuz...',
                        buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
                    });
                    setAlertVisible(true);
                }}>
                    <Text style={{ color: theme.accent, fontWeight: 'bold' }}>İncele</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => {
                setAlertConfig({
                    title: 'Hedef Geçmişi',
                    message: `${primaryGoal.name} hedefine yapılan son katkılar:\n- 10.05.2024: ₺5.000\n- 15.04.2024: ₺2.500`,
                    buttons: [{ text: 'Kapat', onPress: () => setAlertVisible(false) }]
                });
                setAlertVisible(true);
            }}>
                <View style={[styles.goalContainer, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    <View style={styles.goalHeader}>
                        <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{primaryGoal.name} Hedefi</Text>
                        <Text style={[styles.goalPercent, { color: theme.accent }]}>%{(primaryGoal.saved / primaryGoal.target * 100).toFixed(0)}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <LinearGradient
                            colors={[COLORS.accentBlue, COLORS.accentPurple]}
                            style={[styles.progressBarFill, { width: `${Math.min((primaryGoal.saved / primaryGoal.target) * 100, 100)}%` }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </View>
                    <Text style={[styles.cashFlowText, { color: theme.accent }]}>✨ Yatırıma hazır {formatCurrency(savingsPotential > 0 ? savingsPotential : 0)} nakitiniz var.</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                ref={scrollViewRef}
                data={filteredAssets}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {renderPortfolioSummary()}
                        <Text style={[styles.headerTitle, { color: theme.textSecondary, marginBottom: 10 }]}>
                            Varlıklarım {selectedAssetType ? `(${selectedAssetType})` : ''}
                        </Text>
                    </>
                }
                renderItem={({ item: asset }) => {
                    const profitData = calculateAssetProfitLoss(asset);
                    const isExpanded = expandedAssetId === asset.id;

                    // Varlık Adı Kısaltma ve İkon Eşleştirme
                    const getAssetDisplay = (name, type) => {
                        const lowerName = name.toLowerCase();
                        if (type === 'gold' || lowerName.includes('altın')) return { code: 'XAU', icon: '🟡', label: name.replace(' Altın', '') };
                        if (lowerName.includes('dolar') || name === 'USD') return { code: 'USD', icon: '💵', label: 'Dolar' };
                        if (lowerName.includes('euro') || name === 'EUR') return { code: 'EUR', icon: '💶', label: 'Euro' };
                        if (lowerName.includes('sterlin') || name === 'GBP') return { code: 'GBP', icon: '💷', label: 'Sterlin' };
                        if (type === 'crypto') return { code: name.substring(0, 4).toUpperCase(), icon: '₿', label: name };
                        if (type === 'stock') return { code: name.substring(0, 5).toUpperCase(), icon: '📈', label: name };
                        return { code: name.substring(0, 3).toUpperCase(), icon: '💎', label: name };
                    };

                    const display = getAssetDisplay(asset.name, asset.type);

                    return (
                        <TouchableOpacity
                            key={asset.id}
                            activeOpacity={0.9}
                            onPress={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                        >
                            <View style={[styles.assetCard, {
                                backgroundColor: theme.cardBg,
                                borderColor: profitData.hasLiveData ? (profitData.isProfit ? COLORS.accentGreen : COLORS.accentRed) : theme.glassBorder,
                                borderWidth: profitData.hasLiveData ? 1.5 : 1,
                                padding: 16,
                                borderRadius: 20,
                                marginBottom: 12
                            }]}>
                                <View style={styles.assetHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Text style={{ fontSize: 20 }}>{display.icon}</Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.assetName, { color: theme.textPrimary, fontSize: 16, fontWeight: '700' }]}>{display.code}</Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{display.label}</Text>
                                        </View>
                                        {profitData.hasLiveData && (
                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accentGreen, marginLeft: 8, marginTop: -14 }} />
                                        )}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.assetAmount, { color: theme.textPrimary, fontSize: 16, fontWeight: '600' }]}>{asset.amount} adet</Text>
                                    </View>
                                </View>

                                <View style={[styles.assetDetails, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                                    <View>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary, fontSize: 11, marginBottom: 4 }]}>ALIŞ</Text>
                                        <Text style={[styles.detailValue, { color: theme.textPrimary, fontSize: 14 }]}>{formatCurrency(asset.avgCost)}</Text>
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <Text style={[styles.detailLabel, { color: theme.textSecondary, fontSize: 11 }]}>GÜNCEL</Text>
                                            {profitData.hasLiveData && <Text style={{ fontSize: 10, marginLeft: 4 }}>📡</Text>}
                                        </View>
                                        <Text style={[styles.detailValue, { color: profitData.hasLiveData ? COLORS.accentBlue : theme.textPrimary, fontSize: 14, fontWeight: '600' }]}>
                                            {formatCurrency(profitData.currentPrice)}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary, fontSize: 11, marginBottom: 4 }]}>DURUM</Text>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: profitData.isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 8
                                        }}>
                                            <Text style={{
                                                fontSize: 13,
                                                fontWeight: '700',
                                                color: profitData.isProfit ? COLORS.accentGreen : COLORS.accentRed
                                            }}>
                                                {profitData.isProfit ? '▲' : '▼'} {profitData.isProfit ? '+' : ''}{profitData.percentage}%
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {isExpanded && (
                                    <View style={styles.assetActions}>
                                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.accentGreen }]} onPress={() => handleTrade('buy', asset)}>
                                            <Text style={styles.actionButtonText}>Alım Ekle</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.accentRed }]} onPress={() => handleTrade('sell', asset)}>
                                            <Text style={styles.actionButtonText}>Satış Ekle</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={() => deleteAsset(asset.id)}>
                                            <Text style={[styles.actionButtonText, { color: COLORS.accentRed }]}>Sil</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListFooterComponent={
                    <>
                        {renderAnalysis()}
                        <View style={{ height: 100 }} />
                    </>
                }
            />

            {/* Trade Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={tradeModalVisible}
                onRequestClose={() => setTradeModalVisible(false)}
            >
                <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
                        <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                                {tradeConfig.type === 'buy' ? 'Alım Ekle' : 'Satış Ekle'}
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                                {tradeConfig.asset?.name} ({tradeConfig.asset?.amount})
                            </Text>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Miktar</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                                    placeholder="Örn: 10"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="numeric"
                                    value={tradeAmount}
                                    onChangeText={setTradeAmount}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.modalButton, { borderColor: theme.glassBorder }]} onPress={() => setTradeModalVisible(false)}>
                                    <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: tradeConfig.type === 'buy' ? COLORS.accentGreen : COLORS.accentRed, borderColor: 'transparent' }]}
                                    onPress={handlePreTrade}
                                >
                                    <Text style={[styles.modalButtonText, { color: 'white', fontWeight: 'bold' }]}>
                                        {tradeConfig.type === 'buy' ? 'Ekle' : 'Çıkar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </BlurView>
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
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 5,
    },
    summaryContainer: {
        marginBottom: 20,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 10,
        marginBottom: 10,
    },
    totalValue: {
        color: 'white',
        fontSize: 32,
        fontWeight: '700',
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    changeText: {
        color: COLORS.accentGreen,
        fontSize: 14,
        fontWeight: '600',
    },
    arrowIcon: {
        color: COLORS.accentGreen,
        fontSize: 12,
        marginLeft: 2,
    },
    chartContainer: {
        marginBottom: 20,
    },
    allocationContainer: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    subTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    donutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    legendContainer: {
        gap: 8,
    },
    legendItem: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionContainer: {
        marginBottom: 25,
    },
    headerTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 10,
        marginLeft: 5,
    },
    assetCard: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        marginBottom: 10,
    },
    assetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    assetName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    assetAmount: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    assetDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
        marginBottom: 2,
    },
    detailValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    riskCard: {
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accentRed,
        marginBottom: 10,
    },
    riskTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    riskDesc: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    adviceCard: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 20,
    },
    adviceTitle: {
        color: COLORS.accentYellow,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    adviceText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        lineHeight: 18,
    },
    goalContainer: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    goalTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    goalPercent: {
        color: COLORS.accentBlue,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    cashFlowText: {
        color: COLORS.accentGreen,
        fontSize: 12,
        fontStyle: 'italic',
    },
    timeRangeContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        padding: 2,
    },
    timeRangeButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    timeRangeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    assetActions: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 10,
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    applyAdviceButton: {
        marginTop: 10,
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    applyAdviceText: {
        fontSize: 12,
        fontWeight: '600',
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
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
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

export default InvestmentsScreen;
