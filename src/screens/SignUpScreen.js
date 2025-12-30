import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const SignUpScreen = ({ onNavigateToLogin }) => {
    const { signUp, isLoading, authError, clearError } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSignUp = async () => {
        // Clear previous errors
        setLocalError('');
        clearError();

        // Validation
        if (!email.trim()) {
            setLocalError('E-posta adresi gerekli.');
            return;
        }
        if (!password) {
            setLocalError('Şifre gerekli.');
            return;
        }
        if (password.length < 6) {
            setLocalError('Şifre en az 6 karakter olmalıdır.');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Şifreler eşleşmiyor.');
            return;
        }

        const result = await signUp(email.trim(), password, name.trim());
        if (!result.success) {
            setLocalError(result.error);
        }
        // If successful, AuthContext will handle the state change
    };

    const displayError = localError || authError;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[COLORS.background, '#0a1628', '#0d1f35']}
                style={styles.gradient}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.logo}>🚀</Text>
                            <Text style={styles.title}>Hesap Oluştur</Text>
                            <Text style={styles.subtitle}>Finansal yolculuğunuza başlayın</Text>
                        </View>

                        {/* Sign Up Form */}
                        <View style={styles.formContainer}>
                            {displayError && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{displayError}</Text>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Ad Soyad (Opsiyonel)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Adınız Soyadınız"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>E-posta *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ornek@email.com"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Şifre *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="En az 6 karakter"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Şifre Tekrar *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Şifrenizi tekrar girin"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                                onPress={handleSignUp}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.signUpButtonText}>Kayıt Ol</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.termsText}>
                                Kayıt olarak{' '}
                                <Text style={styles.termsLink}>Kullanım Koşulları</Text>
                                {' '}ve{' '}
                                <Text style={styles.termsLink}>Gizlilik Politikası</Text>
                                'nı kabul etmiş olursunuz.
                            </Text>
                        </View>

                        {/* Login Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
                            <TouchableOpacity onPress={onNavigateToLogin}>
                                <Text style={styles.loginLink}>Giriş Yap</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 50,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 18,
    },
    inputLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: 'white',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    signUpButton: {
        backgroundColor: COLORS.accentGreen,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    signUpButtonDisabled: {
        opacity: 0.7,
    },
    signUpButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    termsText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
    termsLink: {
        color: COLORS.accentGreen,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    loginLink: {
        color: COLORS.accentGreen,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SignUpScreen;
