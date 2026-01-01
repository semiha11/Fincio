import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Firestore Service for Fincio App
 * 
 * Data Structure:
 * /users/{uid}
 *   - email, displayName, firstName, lastName, financialGoals, createdAt, updatedAt
 *   - /transactions (expenses)
 *   - /regularIncome
 *   - /irregularIncome
 *   - /recurringPayments
 *   - /extraPayments
 *   - /debts
 *   - /assets
 *   - /goals
 *   - /budgets
 *   - /userSettings
 */

// Generic collection reference helper
const getUserCollection = (userId, collectionName) => {
    return collection(db, 'users', userId, collectionName);
};

const getUserDoc = (userId) => {
    return doc(db, 'users', userId);
};

// ============ TRANSACTIONS (Expenses) ============

export const addTransaction = async (userId, transaction) => {
    try {
        const collectionRef = getUserCollection(userId, 'transactions');
        const docRef = await addDoc(collectionRef, {
            ...transaction,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding transaction:', error);
        return { success: false, error: error.message };
    }
};

export const getTransactions = async (userId) => {
    try {
        const collectionRef = getUserCollection(userId, 'transactions');
        const q = query(collectionRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: transactions };
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return { success: false, error: error.message };
    }
};

export const deleteTransaction = async (userId, transactionId) => {
    try {
        const docRef = doc(db, 'users', userId, 'transactions', transactionId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: error.message };
    }
};

// ============ INCOME ============

export const addIncome = async (userId, income, type = 'regular') => {
    const collectionName = type === 'regular' ? 'regularIncome' : 'irregularIncome';
    try {
        const collectionRef = getUserCollection(userId, collectionName);
        const docRef = await addDoc(collectionRef, {
            ...income,
            type,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding income:', error);
        return { success: false, error: error.message };
    }
};

export const getIncome = async (userId, type = 'regular') => {
    const collectionName = type === 'regular' ? 'regularIncome' : 'irregularIncome';
    try {
        const collectionRef = getUserCollection(userId, collectionName);
        const snapshot = await getDocs(collectionRef);
        const income = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: income };
    } catch (error) {
        console.error('Error fetching income:', error);
        return { success: false, error: error.message };
    }
};

export const updateIncome = async (userId, incomeId, incomeData, type = 'regular') => {
    const collectionName = type === 'regular' ? 'regularIncome' : 'irregularIncome';
    try {
        const docRef = doc(db, 'users', userId, collectionName, incomeId);
        await updateDoc(docRef, {
            ...incomeData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating income:', error);
        return { success: false, error: error.message };
    }
};

export const deleteIncome = async (userId, incomeId, type = 'regular') => {
    const collectionName = type === 'regular' ? 'regularIncome' : 'irregularIncome';
    try {
        const docRef = doc(db, 'users', userId, collectionName, incomeId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting income:', error);
        return { success: false, error: error.message };
    }
};

// ============ RECURRING PAYMENTS ============

export const addRecurringPayment = async (userId, payment) => {
    try {
        const collectionRef = getUserCollection(userId, 'recurringPayments');
        const docRef = await addDoc(collectionRef, {
            ...payment,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding recurring payment:', error);
        return { success: false, error: error.message };
    }
};

export const getRecurringPayments = async (userId) => {
    try {
        const collectionRef = getUserCollection(userId, 'recurringPayments');
        const snapshot = await getDocs(collectionRef);
        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: payments };
    } catch (error) {
        console.error('Error fetching recurring payments:', error);
        return { success: false, error: error.message };
    }
};

export const updateRecurringPayment = async (userId, paymentId, paymentData) => {
    try {
        const docRef = doc(db, 'users', userId, 'recurringPayments', paymentId);
        await updateDoc(docRef, {
            ...paymentData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating recurring payment:', error);
        return { success: false, error: error.message };
    }
};

export const deleteRecurringPayment = async (userId, paymentId) => {
    try {
        const docRef = doc(db, 'users', userId, 'recurringPayments', paymentId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting recurring payment:', error);
        return { success: false, error: error.message };
    }
};

// ============ EXTRA PAYMENTS ============

export const addExtraPayment = async (userId, payment) => {
    try {
        const collectionRef = getUserCollection(userId, 'extraPayments');
        const docRef = await addDoc(collectionRef, {
            ...payment,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding extra payment:', error);
        return { success: false, error: error.message };
    }
};

export const getExtraPayments = async (userId) => {
    try {
        const collectionRef = getUserCollection(userId, 'extraPayments');
        const snapshot = await getDocs(collectionRef);
        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: payments };
    } catch (error) {
        console.error('Error fetching extra payments:', error);
        return { success: false, error: error.message };
    }
};

export const deleteExtraPayment = async (userId, paymentId) => {
    try {
        const docRef = doc(db, 'users', userId, 'extraPayments', paymentId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting extra payment:', error);
        return { success: false, error: error.message };
    }
};

// ============ DEBTS ============

export const addDebt = async (userId, debt) => {
    try {
        const collectionRef = getUserCollection(userId, 'debts');
        const docRef = await addDoc(collectionRef, {
            ...debt,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding debt:', error);
        return { success: false, error: error.message };
    }
};

export const getDebts = async (userId) => {
    try {
        const collectionRef = getUserCollection(userId, 'debts');
        const snapshot = await getDocs(collectionRef);
        const debts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: debts };
    } catch (error) {
        console.error('Error fetching debts:', error);
        return { success: false, error: error.message };
    }
};

export const updateDebt = async (userId, debtId, debtData) => {
    try {
        const docRef = doc(db, 'users', userId, 'debts', debtId);
        await updateDoc(docRef, {
            ...debtData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating debt:', error);
        return { success: false, error: error.message };
    }
};

export const deleteDebt = async (userId, debtId) => {
    try {
        const docRef = doc(db, 'users', userId, 'debts', debtId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting debt:', error);
        return { success: false, error: error.message };
    }
};

// ============ ASSETS ============

export const addAsset = async (userId, asset) => {
    try {
        const collectionRef = getUserCollection(userId, 'assets');
        const docRef = await addDoc(collectionRef, {
            ...asset,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding asset:', error);
        return { success: false, error: error.message };
    }
};

export const getAssets = async (userId) => {
    try {
        const collectionRef = getUserCollection(userId, 'assets');
        const snapshot = await getDocs(collectionRef);
        const assets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: assets };
    } catch (error) {
        console.error('Error fetching assets:', error);
        return { success: false, error: error.message };
    }
};

export const updateAsset = async (userId, assetId, assetData) => {
    try {
        const docRef = doc(db, 'users', userId, 'assets', assetId);
        await updateDoc(docRef, {
            ...assetData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating asset:', error);
        return { success: false, error: error.message };
    }
};

export const deleteAsset = async (userId, assetId) => {
    try {
        const docRef = doc(db, 'users', userId, 'assets', assetId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting asset:', error);
        return { success: false, error: error.message };
    }
};

// Real-time listener for assets
export const subscribeToAssets = (userId, callback) => {
    const collectionRef = collection(db, 'users', userId, 'assets');
    return onSnapshot(collectionRef, (snapshot) => {
        const assets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(assets);
    }, (error) => {
        console.error('Error in assets subscription:', error);
    });
};

// ============ GOALS ============

export const addGoal = async (userId, goal) => {
    try {
        const collectionRef = getUserCollection(userId, 'goals');
        const docRef = await addDoc(collectionRef, {
            ...goal,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding goal:', error);
        return { success: false, error: error.message };
    }
};

export const getGoals = async (userId) => {
    try {
        const collectionRef = getUserCollection(userId, 'goals');
        const snapshot = await getDocs(collectionRef);
        const goals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: goals };
    } catch (error) {
        console.error('Error fetching goals:', error);
        return { success: false, error: error.message };
    }
};

export const updateGoal = async (userId, goalId, goalData) => {
    try {
        const docRef = doc(db, 'users', userId, 'goals', goalId);
        await updateDoc(docRef, {
            ...goalData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating goal:', error);
        return { success: false, error: error.message };
    }
};

export const deleteGoal = async (userId, goalId) => {
    try {
        const docRef = doc(db, 'users', userId, 'goals', goalId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting goal:', error);
        return { success: false, error: error.message };
    }
};

// ============ USER SETTINGS ============

export const saveUserSettings = async (userId, settings) => {
    try {
        const docRef = doc(db, 'users', userId, 'settings', 'preferences');
        await setDoc(docRef, {
            ...settings,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error saving user settings:', error);
        return { success: false, error: error.message };
    }
};

export const getUserSettings = async (userId) => {
    try {
        const docRef = doc(db, 'users', userId, 'settings', 'preferences');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: true, data: null };
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return { success: false, error: error.message };
    }
};

// ============ FINANCIAL DATA (Summary) ============

export const saveFinancialData = async (userId, financialData) => {
    try {
        const docRef = doc(db, 'users', userId, 'financialData', 'summary');
        await setDoc(docRef, {
            ...financialData,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error saving financial data:', error);
        return { success: false, error: error.message };
    }
};

export const getFinancialData = async (userId) => {
    try {
        const docRef = doc(db, 'users', userId, 'financialData', 'summary');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: true, data: null };
    } catch (error) {
        console.error('Error fetching financial data:', error);
        return { success: false, error: error.message };
    }
};

// ============ BULK SYNC HELPERS ============

export const syncAllDataToFirestore = async (userId, allData) => {
    try {
        const promises = [];

        // Sync each collection
        if (allData.transactions) {
            for (const item of allData.transactions) {
                promises.push(addTransaction(userId, item));
            }
        }
        if (allData.regularIncome) {
            for (const item of allData.regularIncome) {
                promises.push(addIncome(userId, item, 'regular'));
            }
        }
        if (allData.irregularIncome) {
            for (const item of allData.irregularIncome) {
                promises.push(addIncome(userId, item, 'irregular'));
            }
        }
        if (allData.recurringPayments) {
            for (const item of allData.recurringPayments) {
                promises.push(addRecurringPayment(userId, item));
            }
        }
        if (allData.extraPayments) {
            for (const item of allData.extraPayments) {
                promises.push(addExtraPayment(userId, item));
            }
        }
        if (allData.debts) {
            for (const item of allData.debts) {
                promises.push(addDebt(userId, item));
            }
        }
        if (allData.assets) {
            for (const item of allData.assets) {
                promises.push(addAsset(userId, item));
            }
        }
        if (allData.goals) {
            for (const item of allData.goals) {
                promises.push(addGoal(userId, item));
            }
        }

        await Promise.all(promises);
        return { success: true };
    } catch (error) {
        console.error('Error syncing all data:', error);
        return { success: false, error: error.message };
    }
};

export const fetchAllDataFromFirestore = async (userId) => {
    try {
        const [
            transactionsResult,
            regularIncomeResult,
            irregularIncomeResult,
            recurringPaymentsResult,
            extraPaymentsResult,
            debtsResult,
            assetsResult,
            goalsResult,
            settingsResult,
            financialDataResult
        ] = await Promise.all([
            getTransactions(userId),
            getIncome(userId, 'regular'),
            getIncome(userId, 'irregular'),
            getRecurringPayments(userId),
            getExtraPayments(userId),
            getDebts(userId),
            getAssets(userId),
            getGoals(userId),
            getUserSettings(userId),
            getFinancialData(userId)
        ]);

        return {
            success: true,
            data: {
                transactions: transactionsResult.data || [],
                regularIncome: regularIncomeResult.data || [],
                irregularIncome: irregularIncomeResult.data || [],
                recurringPayments: recurringPaymentsResult.data || [],
                extraPayments: extraPaymentsResult.data || [],
                debts: debtsResult.data || [],
                assets: assetsResult.data || [],
                goals: goalsResult.data || [],
                userSettings: settingsResult.data || null,
                financialData: financialDataResult.data || null
            }
        };
    } catch (error) {
        console.error('Error fetching all data:', error);
        return { success: false, error: error.message };
    }
};
