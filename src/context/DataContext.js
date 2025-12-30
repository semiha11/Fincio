import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { COLORS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firestoreService from '../services/firestoreService';

export const DataContext = createContext();

const STORAGE_KEYS = {
    FINANCIAL_DATA: '@fincio_financial_data',
    DEBTS_LIST: '@fincio_debts_list',
    REGULAR_INCOME: '@fincio_regular_income',
    IRREGULAR_INCOME: '@fincio_irregular_income',
    EXPENSES: '@fincio_expenses', // transactions? (Wait, transactions state exists? checking file)
    USER_SETTINGS: '@fincio_user_settings',
    RECURRING_PAYMENTS: '@fincio_recurring_payments',
    EXTRA_PAYMENTS: '@fincio_extra_payments',
    BUDGETS: '@fincio_budgets',
    GOALS: '@fincio_goals',
    ACCOUNTS: '@fincio_accounts',
    ASSETS: '@fincio_assets',
    NOTIFICATIONS: '@fincio_notifications', // If exists
    TRANSACTIONS: '@fincio_transactions',
    TRANSACTIONS: '@fincio_transactions',
    USER_PROFILE: '@fincio_user_profile',
    FIRST_LOGIN: '@fincio_first_login',
    START_DATE: '@fincio_start_date' // New key for score calculation
};

export const DataProvider = ({ children, userId }) => {
    // Flag to track if initial load is complete
    const [isLoaded, setIsLoaded] = useState(false);

    // Dynamic Score State
    const [fincioScore, setFincioScore] = useState(0);
    const [startDate, setStartDate] = useState(null);

    // --- Financial Health Data (Manual Overlay) ---
    // User wants to manually edit "Summary" Assets/Debts.
    // Ideally this might be calculated, but request says "manual edit".
    // We initialize with the values seen in FinancialHealth.js
    const [financialData, setFinancialData] = useState({
        assets: 0,
        debts: 0
    });

    // --- Detailed Debt Management ---
    const [debtsList, setDebtsList] = useState([]);

    // Transactions for Spending Analysis
    const [transactions, setTransactions] = useState([]);

    // Optimized: Calculate total debts and net worth in useMemo to avoid effect-based double renders
    const { totalDebts, netWorth } = useMemo(() => {
        const calculatedTotalDebts = debtsList
            .filter(d => d.status === 'active' || !d.status)
            .reduce((sum, debt) => sum + debt.remainingAmount, 0);

        return {
            totalDebts: calculatedTotalDebts,
            netWorth: financialData.assets - calculatedTotalDebts
        };
    }, [debtsList, financialData.assets]);

    // Sync calculated debts back to financialData structure only if needed for consumers expecting 'financialData' object
    // But ideally consumers should use 'netWorth' and 'totalDebts' directly.
    // For backward compatibility with existing code:
    const activeFinancialData = useMemo(() => ({
        ...financialData,
        debts: totalDebts,
        netWorth: netWorth
    }), [financialData, totalDebts, netWorth]);

    const addDebt = useCallback((debt) => {
        setDebtsList(prev => [...prev, { ...debt, id: Date.now(), status: 'active' }]);
    }, []);

    const deleteDebt = useCallback((id) => {
        setDebtsList(prev => prev.filter(debt => debt.id !== id));
    }, []);

    const updateFinancialData = useCallback((newData) => {
        setFinancialData(prev => ({ ...prev, ...newData }));
    }, []);

    const addToAssets = useCallback((amount) => {
        setFinancialData(prev => ({
            ...prev,
            assets: prev.assets + Number(amount)
        }));
    }, []);

    // We need to define addTransaction before payDebt since payDebt uses it.
    // However, context functions can hoist in useCallback if we use ref, OR we just define addTransaction first.
    // Better: define addTransaction first. But we are in "replace chunks" mode.
    // Strategy: I will declare addTransaction HERE (variable hoisting doesn't work for const), so I'll move addTransaction up or just rely on the setTransactions callback.
    // Actually, payDebt calls `addTransaction`. If `addTransaction` is defined LATER in the file, we can't call it here easily unless we use a functional update or move definition.
    // I will use `setTransactions` directly inside payDebt to avoid dependency cycle/ordering issues in this refactor step, OR move addTransaction up.
    // Moving addTransaction up is safer.

    // Let's implement addTransaction helper here first to be safe, or just use setTransactions since that's what addTransaction does.
    const _addTransactionInternal = (transaction) => {
        setTransactions(prev => [transaction, ...prev]);
    };

    const payDebt = useCallback((amount, description, debtId = null, source = 'budget') => {
        const amountNum = Number(amount);

        // 1. Decrease Specific Debt or General Debt
        if (debtId) {
            setDebtsList(prev => prev.map(debt => {
                if (debt.id === debtId) {
                    return { ...debt, remainingAmount: Math.max(0, debt.remainingAmount - amountNum) };
                }
                return debt;
            }));
        } else {
            setDebtsList(prev => {
                const newDebts = [...prev];
                const activeDebts = newDebts.filter(d => d.status === 'active');
                if (activeDebts.length > 0) {
                    activeDebts[0].remainingAmount = Math.max(0, activeDebts[0].remainingAmount - amountNum);
                }
                return newDebts;
            });
        }

        // 2. Handle Payment Source
        if (source === 'asset') {
            setFinancialData(prev => ({
                ...prev,
                assets: Math.max(0, prev.assets - amountNum)
            }));
        } else {
            // Default 'budget': Add Transaction
            _addTransactionInternal({
                id: Date.now(),
                name: description || 'Borç Ödemesi',
                amount: amountNum,
                category: 'Borç Ödemesi',
                date: 'Bugün',
                icon: '📉',
                timestamp: new Date().toISOString()
            });
        }
    }, []);


    const payOffDebt = useCallback((debtId, source) => {
        const debt = debtsList.find(d => d.id === debtId);
        if (!debt) return;

        const amountToPay = debt.remainingAmount;

        setDebtsList(prev => prev.map(d => {
            if (d.id === debtId) {
                return {
                    ...d,
                    remainingAmount: 0,
                    status: 'paid',
                    completedDate: new Date().toISOString()
                };
            }
            return d;
        }));

        if (source === 'asset') {
            setFinancialData(prev => ({
                ...prev,
                assets: Math.max(0, prev.assets - amountToPay)
            }));
        } else {
            _addTransactionInternal({
                id: Date.now(),
                name: `${debt.name} Kapatma`,
                amount: amountToPay,
                category: 'Borç Ödemesi',
                date: 'Bugün',
                icon: '🎉',
                timestamp: new Date().toISOString()
            });
        }
    }, [debtsList]); // Dependency on debtsList is necessary here
    // --- Initial Data (Empty for new users) ---
    const [regularIncome, setRegularIncome] = useState([]);

    const [irregularIncome, setIrregularIncome] = useState([]);

    const [accounts, setAccounts] = useState([]);

    const [assets, setAssets] = useState([]);

    const [budgets, setBudgets] = useState([]);

    const [goals, setGoals] = useState([]);

    const [payYourselfRule, setPayYourselfRule] = useState({ percent: 10, amount: 0, active: false });

    const [recurringPayments, setRecurringPayments] = useState([]);

    const [extraPayments, setExtraPayments] = useState([]);

    // User Settings
    const [userSettings, setUserSettings] = useState({
        themeMode: 'dark', // 'dark', 'light', 'system'
        currency: 'TRY', // 'TRY', 'USD', 'EUR'
        accentColor: COLORS.accentGreen,
        financialMonthStart: 1, // Default: 1st of the month
        region: 'TR', // 'TR', 'US', 'DE'
        dateFormat: 'DD.MM.YYYY', // 'DD.MM.YYYY', 'MM/DD/YYYY'
        timeFormat: '24h', // '24h', '12h'
        budgetLimitPercentage: 100, // Default 100% of regular income
        budgetLimitAmount: 0 // Manual budget limit
    });

    const [userProfile, setUserProfile] = useState({
        name: '',
        email: ''
    });

    // --- Global Navigation State ---
    const [currentScreen, setCurrentScreen] = useState('Home');

    // --- Onboarding State ---
    const [firstLoginDone, setFirstLoginDone] = useState(false); // Default false implies tour starts
    const [onboardingStep, setOnboardingStep] = useState(0); // 0 = inactive, 1..N = steps

    // Start tour if first login is false
    useEffect(() => {
        if (!firstLoginDone && isLoaded) {
            setOnboardingStep(1);
        }
    }, [firstLoginDone, isLoaded]);

    // Calculate Fincio Score (Days since start)
    useEffect(() => {
        if (startDate) {
            const start = new Date(startDate);
            const now = new Date();
            const diffTime = Math.abs(now - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setFincioScore(Math.max(0, diffDays)); // Ensure non-negative
        } else if (isLoaded && !startDate) {
            // If loaded but no start date (first run or migration), set it
            const now = new Date().toISOString();
            setStartDate(now);
            AsyncStorage.setItem(STORAGE_KEYS.START_DATE, JSON.stringify(now));
            setFincioScore(0);
        }
    }, [startDate, isLoaded]);

    const exchangeRates = {
        TRY: 1,
        USD: 30,
        EUR: 33
    };

    // --- Date/Time Helper Functions ---
    const getDaysRemaining = useCallback((targetDay) => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let targetDate = new Date(currentYear, currentMonth, targetDay);

        if (currentDay > targetDay) {
            // Target day has passed this month, so target is next month
            targetDate = new Date(currentYear, currentMonth + 1, targetDay);
        }

        const diffTime = Math.abs(targetDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Time Formatting
        let formattedTime;
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');

        if (userSettings.timeFormat === '12h') {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            formattedTime = `${hours}:${minutes} ${ampm}`;
        } else {
            formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }

        if (date.toDateString() === today.toDateString()) {
            return `Bugün, ${formattedTime}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Dün, ${formattedTime}`;
        } else {
            // Date Formatting
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            if (userSettings.dateFormat === 'MM/DD/YYYY') {
                return `${month}/${day}/${year}`;
            } else {
                return `${day}.${month}.${year}`;
            }
        }
    }, [userSettings.timeFormat, userSettings.dateFormat]);

    const groupTransactionsByDate = useCallback((transactionsList) => {
        const groups = {};

        transactionsList.forEach(transaction => {
            let dateKey = transaction.date;

            if (transaction.timestamp) {
                const date = new Date(transaction.timestamp);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                if (date.toDateString() === today.toDateString()) {
                    dateKey = 'Bugün';
                } else if (date.toDateString() === yesterday.toDateString()) {
                    dateKey = 'Dün';
                } else {
                    // Date Formatting for Header
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();

                    if (userSettings.dateFormat === 'MM/DD/YYYY') {
                        dateKey = `${month}/${day}/${year}`;
                    } else {
                        dateKey = `${day}.${month}.${year}`;
                    }
                }
            }

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(transaction);
        });

        return Object.keys(groups).map(title => ({
            title,
            data: groups[title]
        }));
    }, [userSettings.dateFormat]);

    const formatCurrency = useCallback((amount) => {
        const rate = exchangeRates[userSettings.currency] || 1;
        const converted = amount / rate;

        const formatter = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: userSettings.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        return formatter.format(converted);
    }, [userSettings.currency, exchangeRates]);

    // --- Persistence Logic ---

    // Load Data on Mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const storedFinancialData = await AsyncStorage.getItem(STORAGE_KEYS.FINANCIAL_DATA);
                const storedDebtsList = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS_LIST);
                const storedRegularIncome = await AsyncStorage.getItem(STORAGE_KEYS.REGULAR_INCOME);
                const storedIrregularIncome = await AsyncStorage.getItem(STORAGE_KEYS.IRREGULAR_INCOME);
                const storedUserSettings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
                const storedRecurringPayments = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING_PAYMENTS);
                const storedExtraPayments = await AsyncStorage.getItem(STORAGE_KEYS.EXTRA_PAYMENTS);
                const storedBudgets = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
                const storedGoals = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
                const storedAccounts = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
                const storedAssets = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
                const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS); // Need to verify if transactions state is defined in file

                if (storedFinancialData) setFinancialData(JSON.parse(storedFinancialData));
                if (storedDebtsList) setDebtsList(JSON.parse(storedDebtsList));
                if (storedRegularIncome) setRegularIncome(JSON.parse(storedRegularIncome));
                if (storedIrregularIncome) setIrregularIncome(JSON.parse(storedIrregularIncome));
                if (storedUserSettings) setUserSettings(JSON.parse(storedUserSettings));
                if (storedRecurringPayments) setRecurringPayments(JSON.parse(storedRecurringPayments));
                if (storedExtraPayments) setExtraPayments(JSON.parse(storedExtraPayments));
                if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
                if (storedGoals) setGoals(JSON.parse(storedGoals));
                if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
                if (storedAssets) setAssets(JSON.parse(storedAssets));

                if (storedAssets) setAssets(JSON.parse(storedAssets));

                const storedStartDate = await AsyncStorage.getItem(STORAGE_KEYS.START_DATE);
                if (storedStartDate) setStartDate(JSON.parse(storedStartDate));

                const storedNav = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN);
                if (storedNav) setFirstLoginDone(JSON.parse(storedNav));

                const storedUserProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
                if (storedUserProfile) setUserProfile(JSON.parse(storedUserProfile));

                if (storedTransactions) setTransactions(JSON.parse(storedTransactions));

            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadData();
    }, []);

    // Sync data FROM Firestore when userId is available (on login)
    useEffect(() => {
        const syncFromFirestore = async () => {
            if (userId && isLoaded) {
                try {
                    const result = await firestoreService.fetchAllDataFromFirestore(userId);
                    if (result.success && result.data) {
                        const data = result.data;
                        // Only sync non-empty arrays from Firestore to not overwrite local data with empty
                        if (data.transactions?.length > 0) setTransactions(data.transactions);
                        if (data.regularIncome?.length > 0) setRegularIncome(data.regularIncome);
                        if (data.irregularIncome?.length > 0) setIrregularIncome(data.irregularIncome);
                        if (data.recurringPayments?.length > 0) setRecurringPayments(data.recurringPayments);
                        if (data.extraPayments?.length > 0) setExtraPayments(data.extraPayments);
                        if (data.debts?.length > 0) setDebtsList(data.debts);
                        if (data.assets?.length > 0) setAssets(data.assets);
                        if (data.goals?.length > 0) setGoals(data.goals);
                        if (data.userSettings) setUserSettings(prev => ({ ...prev, ...data.userSettings }));
                        if (data.financialData) setFinancialData(prev => ({ ...prev, ...data.financialData }));
                        console.log('Data synced from Firestore');
                    }
                } catch (error) {
                    console.error('Error syncing from Firestore:', error);
                }
            }
        };
        syncFromFirestore();
    }, [userId, isLoaded]);

    // Sync data TO Firestore when userId and data changes
    useEffect(() => {
        const syncToFirestore = async () => {
            if (userId && isLoaded) {
                try {
                    // Sync transactions
                    await firestoreService.saveFinancialData(userId, financialData);
                } catch (error) {
                    console.error('Error syncing financial data to Firestore:', error);
                }
            }
        };
        // Debounce sync to avoid excessive writes
        const timeoutId = setTimeout(syncToFirestore, 2000);
        return () => clearTimeout(timeoutId);
    }, [userId, isLoaded, financialData]);

    // Save Data Effects
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.FINANCIAL_DATA, JSON.stringify(financialData)); }, [financialData, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.DEBTS_LIST, JSON.stringify(debtsList)); }, [debtsList, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.REGULAR_INCOME, JSON.stringify(regularIncome)); }, [regularIncome, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.IRREGULAR_INCOME, JSON.stringify(irregularIncome)); }, [irregularIncome, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(userSettings)); }, [userSettings, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, JSON.stringify(recurringPayments)); }, [recurringPayments, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.EXTRA_PAYMENTS, JSON.stringify(extraPayments)); }, [extraPayments, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets)); }, [budgets, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)); }, [goals, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts)); }, [accounts, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets)); }, [assets, isLoaded]);

    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile)); }, [userProfile, isLoaded]);
    useEffect(() => { if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, JSON.stringify(firstLoginDone)); }, [firstLoginDone, isLoaded]);

    const theme = useMemo(() => ({
        background: userSettings.themeMode === 'light' ? '#f8fafc' : COLORS.background,
        textPrimary: userSettings.themeMode === 'light' ? '#0f172a' : COLORS.textPrimary,
        textSecondary: userSettings.themeMode === 'light' ? '#334155' : COLORS.textSecondary,
        cardBg: userSettings.themeMode === 'light' ? 'rgba(255, 255, 255, 0.9)' : COLORS.cardBg,
        accent: userSettings.accentColor,
        glassBorder: userSettings.themeMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : COLORS.glassBorder,
    }), [userSettings.themeMode, userSettings.accentColor]);



    // --- Notifications Data ---
    // --- Notifications Data ---
    const [notifications, setNotifications] = useState([]);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    const deleteNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // --- Derived Data (Memoized) ---
    const {
        totalIncome,
        totalExpenses,
        savingsPotential,
        remainingBudget,
        totalBudgetLimit
    } = useMemo(() => {
        const totalRegularIncome = regularIncome.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIrregularIncome = irregularIncome.reduce((sum, item) => sum + Number(item.amount), 0);
        const calcTotalIncome = totalRegularIncome;

        const totalTransactions = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalRecurring = recurringPayments.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalExtra = extraPayments.reduce((sum, item) => sum + Number(item.amount), 0);
        const calcTotalExpenses = totalTransactions + totalRecurring + totalExtra;

        const calcSavingsPotential = calcTotalIncome - calcTotalExpenses;

        const budgetPercentage = userSettings.budgetLimitPercentage !== undefined ? Number(userSettings.budgetLimitPercentage) : 100;
        const manualBudgetAmount = userSettings.budgetLimitAmount !== undefined ? Number(userSettings.budgetLimitAmount) : 0;
        const baseBudget = manualBudgetAmount > 0 ? manualBudgetAmount : totalRegularIncome * (budgetPercentage / 100);
        const calcTotalBudgetLimit = baseBudget + totalIrregularIncome;

        // remainingBudget reflects ALL expenses
        const calcRemainingBudget = calcTotalBudgetLimit - calcTotalExpenses;

        return {
            totalIncome: calcTotalIncome,
            totalExpenses: calcTotalExpenses,
            savingsPotential: calcSavingsPotential,
            remainingBudget: calcRemainingBudget,
            totalBudgetLimit: calcTotalBudgetLimit
        };
    }, [regularIncome, irregularIncome, transactions, recurringPayments, extraPayments, userSettings.budgetLimitPercentage, userSettings.budgetLimitAmount]);

    // --- Actions ---
    // --- Actions (Callback Wrapped) ---
    const addIncome = useCallback(async (item, listType = 'regular') => {
        const newItem = { ...item, id: Date.now(), type: listType };
        if (listType === 'regular') {
            setRegularIncome(prev => [...prev, newItem]);
        } else {
            setIrregularIncome(prev => [...prev, newItem]);
        }

        // Sync to Firestore
        if (userId) {
            try {
                await firestoreService.addIncome(userId, newItem, listType);
            } catch (error) {
                console.error('Error syncing income to Firestore:', error);
            }
        }
    }, [userId]);

    const updateIncome = useCallback((item) => {
        if (item.type === 'regular') {
            setRegularIncome(prev => prev.map(i => i.id === item.id ? item : i));
        } else {
            setIrregularIncome(prev => prev.map(i => i.id === item.id ? item : i));
        }
    }, []);

    const deleteIncome = useCallback((id, type) => {
        if (type === 'regular') {
            setRegularIncome(prev => prev.filter(i => i.id !== id));
        } else {
            setIrregularIncome(prev => prev.filter(i => i.id !== id));
        }
    }, []);

    const updateBudget = useCallback((item) => {
        setBudgets(prev => prev.map(b => b.id === item.id ? item : b));
    }, []);

    const addGoal = useCallback((item) => {
        const newItem = { ...item, id: Date.now(), color: COLORS.accentBlue };
        setGoals(prev => [...prev, newItem]);
    }, []);

    const updateGoal = useCallback((item) => {
        setGoals(prev => prev.map(g => g.id === item.id ? item : g));
    }, []);

    const deleteGoal = useCallback((id) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    }, []);

    const updateRule = useCallback((rule) => {
        setPayYourselfRule(rule);
    }, []);

    const addAccount = useCallback((account) => {
        setAccounts(prev => [...prev, { ...account, id: Date.now() }]);
    }, []);

    const updateAccount = useCallback((account) => {
        setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
    }, []);

    const deleteAccount = useCallback((id) => {
        setAccounts(prev => prev.filter(a => a.id !== id));
    }, []);

    const addAsset = useCallback((asset) => {
        setAssets(prev => [...prev, { ...asset, id: Date.now() }]);
    }, []);

    const updateAsset = useCallback((asset) => {
        setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
    }, []);

    const deleteAsset = useCallback((id) => {
        setAssets(prev => prev.filter(a => a.id !== id));
    }, []);

    const updateAssetAmount = useCallback((id, changeAmount, operation) => {
        setAssets(prev => prev.map(asset => {
            if (asset.id !== id) return asset;

            const cleanAmountStr = asset.amount.replace(/,/g, '');
            const match = cleanAmountStr.match(/[0-9]+(\.[0-9]+)?/);
            if (!match) return asset;
            const currentVal = parseFloat(match[0]);

            const normalizedChangeAmount = changeAmount.replace(',', '.');
            const changeVal = parseFloat(normalizedChangeAmount);

            if (isNaN(changeVal)) return asset;

            let newVal = operation === 'buy' ? currentVal + changeVal : currentVal - changeVal;
            if (newVal < 0) newVal = 0;

            const prefix = cleanAmountStr.substring(0, match.index);
            const suffix = cleanAmountStr.substring(match.index + match[0].length);

            const isInteger = Number.isInteger(newVal);
            const formattedNewVal = isInteger ? newVal.toLocaleString('en-US') : newVal.toFixed(2);

            return { ...asset, amount: `${prefix}${formattedNewVal}${suffix}` };
        }));
    }, []);

    const updateSettings = useCallback((newSettings) => {
        setUserSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const updateBudgetLimitPercentage = useCallback((percentage) => {
        setUserSettings(prev => ({ ...prev, budgetLimitPercentage: percentage, budgetLimitAmount: 0 }));
    }, []);

    const updateBudgetLimitAmount = useCallback((amount) => {
        setUserSettings(prev => ({ ...prev, budgetLimitAmount: amount }));
    }, []);

    /**
     * Resets all financial data to initial empty states.
     * Clears AsyncStorage for relevant keys.
     */
    const resetAllFinancialData = useCallback(async () => {
        try {
            // 1. Reset State
            setFinancialData({ assets: 0, debts: 0, netWorth: 0 });
            setDebtsList([]);
            setRegularIncome([]);
            setIrregularIncome([]);
            setTransactions([]);
            setRecurringPayments([]);
            setExtraPayments([]);
            setBudgets([]);
            setGoals([]);
            setAccounts([]);
            setAssets([]);
            setNotifications([]);
            setUserProfile({ name: 'Misafir Kullanıcı', email: '' });
            setNotifications([]);
            setUserProfile({ name: 'Misafir Kullanıcı', email: '' });
            setFirstLoginDone(false);
            setOnboardingStep(1);

            // Reset Score
            const now = new Date().toISOString();
            setStartDate(now);
            setFincioScore(0);
            AsyncStorage.setItem(STORAGE_KEYS.START_DATE, JSON.stringify(now)); // Immediately persist new start date

            // 2. Clear Storage
            const keys = Object.values(STORAGE_KEYS);
            await AsyncStorage.multiRemove(keys);

        } catch (e) {
            console.error("Reset failed", e);
        }
    }, []);




    const addTransaction = useCallback(async (transaction) => {
        const newTransaction = { ...transaction, id: Date.now() };
        setTransactions(prev => [newTransaction, ...prev]);

        // Sync to Firestore
        if (userId) {
            try {
                await firestoreService.addTransaction(userId, newTransaction);
            } catch (error) {
                console.error('Error syncing transaction to Firestore:', error);
            }
        }
    }, [userId]);

    const addRecurringPayment = useCallback(async (payment) => {
        const newPayment = { ...payment, id: Date.now() };
        setRecurringPayments(prev => [...prev, newPayment]);

        // Sync to Firestore
        if (userId) {
            try {
                await firestoreService.addRecurringPayment(userId, newPayment);
            } catch (error) {
                console.error('Error syncing recurring payment to Firestore:', error);
            }
        }
    }, [userId]);

    const addExtraPayment = useCallback(async (payment) => {
        const newPayment = { ...payment, id: Date.now() };
        setExtraPayments(prev => [...prev, newPayment]);

        // Sync to Firestore
        if (userId) {
            try {
                await firestoreService.addExtraPayment(userId, newPayment);
            } catch (error) {
                console.error('Error syncing extra payment to Firestore:', error);
            }
        }
    }, [userId]);

    const deleteRecurringPayment = useCallback((id) => {
        setRecurringPayments(prev => prev.filter(p => p.id !== id));
    }, []);

    const updateRecurringPayment = useCallback((payment) => {
        setRecurringPayments(prev => prev.map(p => p.id === payment.id ? payment : p));
    }, []);

    const deleteExtraPayment = useCallback((id) => {
        setExtraPayments(prev => prev.filter(p => p.id !== id));
    }, []);

    const updateExtraPayment = useCallback((payment) => {
        setExtraPayments(prev => prev.map(p => p.id === payment.id ? payment : p));
    }, []);

    const contextValue = useMemo(() => ({
        regularIncome,
        irregularIncome,
        budgets,
        goals,
        payYourselfRule,
        transactions,
        addTransaction,
        totalIncome,
        totalExpenses,
        savingsPotential,
        remainingBudget,
        totalBudgetLimit,
        addIncome,
        updateIncome,
        updateBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        updateRule,
        deleteIncome,
        accounts,
        addAccount,
        updateAccount,
        deleteAccount,
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
        updateAssetAmount,
        userSettings,
        updateSettings,
        updateBudgetLimitPercentage,
        updateBudgetLimitAmount,
        resetAllFinancialData,
        userProfile,
        setUserProfile,
        currentScreen,
        setCurrentScreen,
        firstLoginDone,
        setFirstLoginDone,
        onboardingStep,
        setOnboardingStep,
        formatCurrency,
        theme,
        notifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getDaysRemaining, // Helper functions are usually stable if defined outside or via useCallback, but these are defined inside.
        formatDate,       // We should wrap these in useCallback too technically, but they rely on simple things.
        groupTransactionsByDate,
        recurringPayments,
        addRecurringPayment,
        updateRecurringPayment,
        deleteRecurringPayment,
        extraPayments,
        addExtraPayment,
        updateExtraPayment,
        deleteExtraPayment,
        financialData: activeFinancialData,
        updateFinancialData,
        addToAssets,
        payDebt, // payDebt is now useCallback'd
        debtsList,
        addDebt,
        deleteDebt,
        payOffDebt, // Using the implemented useCallback one
        resetAllFinancialData,
        fincioScore // Exposed Score
    }), [
        isLoaded,
        currentScreen,
        userProfile,
        userSettings,
        accounts,
        assets,
        transactions,
        totalIncome,
        regularIncome,
        irregularIncome,
        budgets,
        goals,
        payYourselfRule,
        totalExpenses,
        totalBudgetLimit,
        savingsPotential,
        firstLoginDone,
        onboardingStep,
        theme,
        notifications,
        recurringPayments,
        extraPayments,
        activeFinancialData,
        debtsList,
        fincioScore // Dependency
    ]);


    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

