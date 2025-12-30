import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified
                });
            } else {
                // User is signed out
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign up with email and password
    const signUp = useCallback(async (email, password, displayName = '') => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Split displayName into firstName and lastName
            const nameParts = displayName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Create user document in Firestore
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, {
                email: firebaseUser.email,
                displayName: displayName || '',
                firstName: firstName,
                lastName: lastName,
                financialGoals: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return { success: true, user: firebaseUser };
        } catch (error) {
            let errorMessage = 'Kayıt sırasında bir hata oluştu.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Bu e-posta adresi zaten kullanılıyor.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Geçersiz e-posta adresi.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Şifre en az 6 karakter olmalıdır.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.';
                    break;
                default:
                    errorMessage = error.message;
            }
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sign in with email and password
    const signIn = useCallback(async (email, password) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            let errorMessage = 'Giriş sırasında bir hata oluştu.';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Yanlış şifre.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Geçersiz e-posta adresi.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Bu hesap devre dışı bırakılmış.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'E-posta veya şifre hatalı.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.';
                    break;
                default:
                    errorMessage = error.message;
            }
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        setIsLoading(true);
        try {
            await firebaseSignOut(auth);
            return { success: true };
        } catch (error) {
            setAuthError('Çıkış yapılırken bir hata oluştu.');
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get user profile from Firestore
    const getUserProfile = useCallback(async () => {
        if (!user?.uid) return null;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }, [user?.uid]);

    // Update user profile in Firestore
    const updateUserProfile = useCallback(async (profileData) => {
        if (!user?.uid) return { success: false, error: 'Kullanıcı oturumu yok.' };
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                ...profileData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: 'Profil güncellenirken hata oluştu.' };
        }
    }, [user?.uid]);

    const clearError = useCallback(() => {
        setAuthError(null);
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        authError,
        signUp,
        signIn,
        signOut,
        getUserProfile,
        updateUserProfile,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
