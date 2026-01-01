import AsyncStorage from '@react-native-async-storage/async-storage';

// CollectAPI anahtarı - geçici olarak hardcoded (.env yüklemesi test ediliyor)
const API_KEY = process.env.EXPO_PUBLIC_COLLECT_API_KEY || 'apikey 4glEOcP11uST118wwdnyYg:42ap25wqCBBe8LVpwQoBBL';
const BASE_URL = 'https://api.collectapi.com';

const CACHE_KEYS = {
    GOLD: '@fincio_cache_gold',
    EXCHANGE: '@fincio_cache_exchange',
    CRYPTO: '@fincio_cache_crypto',
    STOCKS: '@fincio_cache_stocks',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

// ============ CACHE YARDIMCI FONKSİYONLARI ============
const getCache = async (key) => {
    try {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;

        return isExpired ? null : data;
    } catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
};

const setCache = async (key, data) => {
    try {
        const cacheItem = JSON.stringify({ data, timestamp: Date.now() });
        await AsyncStorage.setItem(key, cacheItem);
    } catch (error) {
        console.warn('Cache write error:', error);
    }
};

// ============ API ÇAĞRISI ============
const fetchAPI = async (endpoint, cacheKey) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'authorization': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        if (json.success && json.result) {
            return { success: true, data: json.result };
        }

        return { success: false, error: 'Invalid response format' };
    } catch (error) {
        console.warn(`API Error (${endpoint}):`, error.message);
        return { success: false, error: error.message };
    }
};

// ============ YEDEK VERİ (API çöktüğünde kullanılır) ============
// ============ ALTIN FİYATLARI ============
export const getGoldPrices = async () => {
    // Check cache first
    const cached = await getCache(CACHE_KEYS.GOLD);
    if (cached) return { success: true, data: cached, fromCache: true };

    const result = await fetchAPI('/economy/goldPrice', CACHE_KEYS.GOLD);
    if (result.success && !result.stale) {
        await setCache(CACHE_KEYS.GOLD, result.data);
    }
    return result;
};

// ============ DÖVİZ KURLARI ============
export const getExchangeRates = async () => {
    const cached = await getCache(CACHE_KEYS.EXCHANGE);
    if (cached) return { success: true, data: cached, fromCache: true };

    const result = await fetchAPI('/economy/exchange', CACHE_KEYS.EXCHANGE);
    if (result.success && !result.stale) {
        await setCache(CACHE_KEYS.EXCHANGE, result.data);
    }
    return result;
};

// ============ KRİPTO PARALAR ============
export const getCryptoPrices = async () => {
    const cached = await getCache(CACHE_KEYS.CRYPTO);
    if (cached) return { success: true, data: cached, fromCache: true };

    const result = await fetchAPI('/economy/cripto', CACHE_KEYS.CRYPTO);
    if (result.success && !result.stale) {
        await setCache(CACHE_KEYS.CRYPTO, result.data);
    }
    return result;
};

// ============ HİSSE SENETLERİ ============
export const getStockPrices = async () => {
    const cached = await getCache(CACHE_KEYS.STOCKS);
    if (cached) return { success: true, data: cached, fromCache: true };

    const result = await fetchAPI('/economy/hisseSenedi', CACHE_KEYS.STOCKS);
    if (result.success && !result.stale) {
        await setCache(CACHE_KEYS.STOCKS, result.data);
    }
    return result;
};

// ============ TÜM VERİLERİ ÇEK ============
export const getAllFinanceData = async () => {
    const [gold, exchange, crypto, stocks] = await Promise.all([
        getGoldPrices(),
        getExchangeRates(),
        getCryptoPrices(),
        getStockPrices()
    ]);

    // Sabit yedek veriler (sadece acil durum için)
    const FALLBACK_DATA = {
        gold: [{ name: 'Gram Altın', buying: '3050', selling: '3070' }],
        exchange: [{ code: 'USD', name: 'Amerikan Doları', buying: '35.50', selling: '35.70' }],
        crypto: [{ code: 'BTC', name: 'Bitcoin', price: '3200000' }],
        stocks: [{ code: 'THYAO', text: 'Türk Hava Yolları', lastprice: '285.50' }]
    };

    const goldData = gold.success && gold.data?.length > 0 ? gold.data : FALLBACK_DATA.gold;
    const exchangeData = exchange.success && exchange.data?.length > 0 ? exchange.data : FALLBACK_DATA.exchange;
    const cryptoData = crypto.success && crypto.data?.length > 0 ? crypto.data : FALLBACK_DATA.crypto;
    const stocksData = stocks.success && stocks.data?.length > 0 ? stocks.data : FALLBACK_DATA.stocks;

    const usingFallback = {
        gold: !gold.success || !gold.data?.length,
        exchange: !exchange.success || !exchange.data?.length,
        stocks: !stocks.success || !stocks.data?.length
    };

    const anyFallback = usingFallback.gold || usingFallback.exchange || usingFallback.stocks;

    // Gerçek hata durumunu belirle
    let statusMsg = null;
    if (anyFallback) {
        if (gold.error || exchange.error) {
            statusMsg = 'API Bağlantı Hatası: Lütfen anahtarınızı kontrol edin.';
        } else {
            statusMsg = 'Veriler güncellenemedi.';
        }
    }

    return {
        gold: goldData,
        exchange: exchangeData,
        crypto: cryptoData,
        stocks: stocksData,
        hasError: anyFallback,
        statusMessage: statusMsg
    };
};

// ============ VARLIK TİPİNE GÖRE FİYAT BUL ============
export const findAssetPrice = async (assetType, assetName) => {
    let data;

    switch (assetType) {
        case 'gold':
            data = await getGoldPrices();
            if (data.success) {
                const gold = data.data.find(g =>
                    g.name?.toLowerCase().includes(assetName.toLowerCase()) ||
                    assetName.toLowerCase().includes(g.name?.toLowerCase())
                );
                return gold ? parseFloat(gold.buying || gold.selling || 0) : null;
            }
            break;

        case 'currency':
            data = await getExchangeRates();
            if (data.success) {
                const currency = data.data.find(c =>
                    c.code?.toLowerCase() === assetName.toLowerCase() ||
                    c.name?.toLowerCase().includes(assetName.toLowerCase())
                );
                return currency ? parseFloat(currency.buying || currency.rate || 0) : null;
            }
            break;

        case 'crypto':
            data = await getCryptoPrices();
            if (data.success) {
                const crypto = data.data.find(c =>
                    c.code?.toLowerCase() === assetName.toLowerCase() ||
                    c.name?.toLowerCase().includes(assetName.toLowerCase())
                );
                return crypto ? parseFloat(crypto.price || 0) : null;
            }
            break;

        case 'stock':
            data = await getStockPrices();
            if (data.success) {
                const stock = data.data.find(s =>
                    s.code?.toLowerCase() === assetName.toLowerCase() ||
                    s.text?.toLowerCase().includes(assetName.toLowerCase())
                );
                return stock ? parseFloat(stock.lastprice || stock.price || 0) : null;
            }
            break;

        default:
            return null;
    }

    return null;
};

// ============ KÂR/ZARAR HESAPLA ============
export const calculateProfitLoss = (buyPrice, currentPrice, quantity) => {
    const buyValue = buyPrice * quantity;
    const currentValue = currentPrice * quantity;
    const profitLoss = currentValue - buyValue;
    const percentage = buyValue > 0 ? ((currentValue - buyValue) / buyValue) * 100 : 0;

    return {
        buyValue,
        currentValue,
        profitLoss,
        percentage: percentage.toFixed(2),
        isProfit: profitLoss >= 0
    };
};

// ============ CACHE TEMİZLE ============
export const clearFinanceCache = async () => {
    try {
        await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
