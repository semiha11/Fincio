import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, TextInput, ScrollView, Alert, Linking, LayoutAnimation, Platform, UIManager, ActivityIndicator, SafeAreaView } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import CustomAlert from './CustomAlert';
import CustomDatePicker from './CustomDatePicker';

const ProfileModal = ({ visible, onClose }) => {
    const {
        accounts,
        addAccount,
        deleteAccount,
        userSettings,
        updateSettings,
        theme,
        notifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        formatDate,
        resetAllFinancialData,
        userProfile,
        setUserProfile,
        setFirstLoginDone,
        setOnboardingStep,
        setCurrentScreen
    } = useContext(DataContext);
    const { signOut, user, updateUserProfile, getUserProfile } = useAuth();
    const [activeView, setActiveView] = useState('menu'); // menu, profile, settings, notifications, support, manageAccounts, changePassword
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [name, setName] = useState(userProfile.name);
    const [email, setEmail] = useState(userProfile.email);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [financialGoals, setFinancialGoals] = useState('');

    // Fetch profile from Firestore on mount
    useEffect(() => {
        const loadFirestoreProfile = async () => {
            if (user?.uid) {
                const profile = await getUserProfile();
                if (profile) {
                    if (profile.firstName) setFirstName(profile.firstName);
                    if (profile.lastName) setLastName(profile.lastName);
                    if (profile.financialGoals) setFinancialGoals(profile.financialGoals);
                    if (profile.displayName) setName(profile.displayName);
                }
            }
        };
        loadFirestoreProfile();
    }, [user?.uid, getUserProfile]);

    // Update local state when userProfile changes (e.g. after reset)
    useEffect(() => {
        setName(userProfile.name);
        setEmail(userProfile.email);
    }, [userProfile]);

    const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        general: true,
        anomalies: true,
        limits: false,
    });

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    // Account Management State
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState('Banka');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [showAddAccount, setShowAddAccount] = useState(false);

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const hasChanges = name !== userProfile.name || email !== userProfile.email || firstName || lastName || financialGoals;

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        // Update local context
        setUserProfile(prev => ({ ...prev, name, email }));

        // Sync to Firestore
        if (user?.uid) {
            await updateUserProfile({
                displayName: name,
                firstName,
                lastName,
                financialGoals
            });
        }

        setIsSavingProfile(false);
        setAlertConfig({
            title: 'Başarılı',
            message: 'Profil bilgileriniz güncellendi ve buluta kaydedildi.',
            buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
        });
        setAlertVisible(true);
    };

    const handleLogout = async () => {
        setAlertConfig({
            title: 'Çıkış Yap',
            message: 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
            buttons: [
                {
                    text: 'İptal',
                    style: 'cancel',
                    onPress: () => setAlertVisible(false)
                },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        setAlertVisible(false);
                        setIsLoggingOut(true);
                        await signOut();
                        onClose();
                    }
                }
            ]
        });
        setAlertVisible(true);
    };

    const handleAddAccount = () => {
        if (!newAccountName || !newAccountBalance) {
            setAlertConfig({
                title: 'Hata',
                message: 'Lütfen hesap adı ve bakiyesini girin.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }
        addAccount({
            name: newAccountName,
            type: newAccountType,
            balance: Number(newAccountBalance)
        });
        setNewAccountName('');
        setNewAccountBalance('');
        setShowAddAccount(false);
        setShowAddAccount(false);
    };

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setAlertConfig({
                title: 'Hata',
                message: 'Lütfen tüm alanları doldurun.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setAlertConfig({
                title: 'Hata',
                message: 'Yeni şifreler eşleşmiyor.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }
        setAlertConfig({
            title: 'Başarılı',
            message: 'Şifreniz başarıyla güncellendi.',
            buttons: [{
                text: 'Tamam',
                onPress: () => {
                    setAlertVisible(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setActiveView('profile');
                }
            }]
        });
        setAlertVisible(true);
    };

    const menuItems = [
        { id: 'profile', icon: '👤', label: 'Profilim', desc: 'Hesap bilgileri ve güvenlik' },
        { id: 'settings', icon: '⚙️', label: 'Uygulama Ayarları', desc: 'Tema, bildirimler, para birimi' },
        { id: 'notifications', icon: '🔔', label: 'Bildirimler', desc: 'Uyarı geçmişi ve anormallikler' },
        { id: 'support', icon: '❓', label: 'Yardım ve Destek', desc: 'SSS ve iletişim' },
    ];

    const handleBack = () => setActiveView('menu');

    const renderHeader = (title) => (
        <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => activeView === 'menu' ? onClose() : setActiveView('menu')} style={styles.backButton}>
                <Text style={{ color: theme.textSecondary, fontSize: 16 }}>{activeView === 'menu' ? 'Kapat' : '← Geri'}</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{title}</Text>
            <View style={{ width: 50 }} />
        </View>
    );

    const renderMenu = () => (
        <View>
            <Text style={styles.title}>Hesap Yönetimi</Text>
            {menuItems.map(item => (
                <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => setActiveView(item.id)}>
                    <View style={styles.iconBox}>
                        <Text style={styles.icon}>{item.icon}</Text>
                    </View>
                    <View style={styles.content}>
                        <Text style={[styles.label, { color: theme.textPrimary }]}>{item.label}</Text>
                        <Text style={[styles.desc, { color: theme.textPrimary, opacity: 0.8 }]}>{item.desc}</Text>
                    </View>
                    <Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerMode, setPickerMode] = useState('date'); // 'date' or 'time'
    const [testDate, setTestDate] = useState(new Date());

    const handlePickerSelect = (date) => {
        setTestDate(date);
    };

    const handleRegionChange = (region) => {
        let newDateFormat = 'DD.MM.YYYY';
        let newTimeFormat = '24h';

        if (region === 'US') {
            newDateFormat = 'MM/DD/YYYY';
            newTimeFormat = '12h';
        } else if (region === 'TR' || region === 'DE') {
            newDateFormat = 'DD.MM.YYYY';
            newTimeFormat = '24h';
        }

        updateSettings({
            region,
            dateFormat: newDateFormat,
            timeFormat: newTimeFormat
        });
    };



    const renderProfile = () => (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {renderHeader('Profilim')}

            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <Text style={[styles.sectionHeader, { color: theme.accent }]}>Kişisel Bilgiler</Text>
                    {hasChanges && (
                        <TouchableOpacity onPress={handleSaveProfile} style={styles.saveButtonSmall}>
                            <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, opacity: 0.8 }]}>Ad</Text>
                    <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]} value={firstName} onChangeText={setFirstName} placeholder="Adınız" placeholderTextColor={theme.textSecondary} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, opacity: 0.8 }]}>Soyad</Text>
                    <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]} value={lastName} onChangeText={setLastName} placeholder="Soyadınız" placeholderTextColor={theme.textSecondary} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, opacity: 0.8 }]}>E-posta</Text>
                    <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]} value={user?.email || email} editable={false} placeholderTextColor={theme.textSecondary} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, opacity: 0.8 }]}>Finansal Hedefler</Text>
                    <TextInput
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, height: 80, textAlignVertical: 'top' }]}
                        value={financialGoals}
                        onChangeText={setFinancialGoals}
                        placeholder="Ev almak, emeklilik fonu, tatil..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={3}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Güvenlik</Text>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.glassBorder }]} onPress={() => setActiveView('changePassword')}>
                    <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>Şifre Değiştir</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Veri Yönetimi</Text>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.glassBorder }]} onPress={() => setActiveView('manageAccounts')}>
                    <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>Banka Bağlantılarını Yönet</Text>
                </TouchableOpacity>
            </View>


            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Hesap İşlemleri</Text>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.glassBorder }]}
                    onPress={() => {
                        setAlertConfig({
                            title: 'Verileri Sıfırla',
                            message: 'Tüm finansal verileriniz silinecektir. Onaylıyor musunuz?',
                            buttons: [
                                { text: 'İptal', style: 'cancel', onPress: () => setAlertVisible(false) },
                                {
                                    text: 'Evet, Sıfırla',
                                    style: 'destructive',
                                    onPress: () => {
                                        setAlertVisible(false);
                                        resetAllFinancialData();
                                        Alert.alert('Başarılı', 'Veriler sıfırlandı.');
                                        onClose();
                                    }
                                }
                            ]
                        });
                        setAlertVisible(true);
                    }}
                >
                    <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>Tüm Verileri Sıfırla</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></Path>
                        <Path d="M16 17l5-5-5-5"></Path>
                        <Path d="M21 12H9"></Path>
                    </Svg>
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderSettings = () => (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {renderHeader('Uygulama Ayarları')}

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Görünüm</Text>

                <View style={styles.settingRow}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Tema Modu</Text>
                    <View style={[styles.segmentContainer, { backgroundColor: theme.glassBorder }]}>
                        {['Koyu', 'Açık', 'Sistem'].map((mode, index) => {
                            const modeKey = ['dark', 'light', 'system'][index];
                            const isActive = userSettings.themeMode === modeKey;
                            return (
                                <TouchableOpacity
                                    key={modeKey}
                                    style={[styles.segmentButton, isActive && styles.segmentActive]}
                                    onPress={() => updateSettings({ themeMode: modeKey })}
                                >
                                    <Text style={[styles.segmentText, { color: theme.textSecondary }, isActive && { color: theme.textPrimary, fontWeight: '600' }]}>{mode}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={[styles.settingRow, { marginTop: 15 }]}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Vurgu Rengi</Text>
                    <View style={styles.colorPalette}>
                        {[COLORS.accentGreen, COLORS.accentBlue, COLORS.accentPurple, COLORS.accentRed, COLORS.accentYellow].map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[styles.colorOption, { backgroundColor: color }, userSettings.accentColor === color && styles.colorOptionActive]}
                                onPress={() => updateSettings({ accentColor: color })}
                            >
                                {userSettings.accentColor === color && <Text style={styles.checkIcon}>✓</Text>}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>


            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Finansal Ayarlar</Text>
                <View style={styles.rowBetween}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Para Birimi</Text>
                    <View style={[styles.currencySelector, { backgroundColor: theme.glassBorder }]}>
                        {['TRY', 'USD', 'EUR'].map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.currencyOption, userSettings.currency === c && styles.currencyActive]}
                                onPress={() => updateSettings({ currency: c })}
                            >
                                <Text style={[styles.currencyText, { color: theme.textSecondary }, userSettings.currency === c && { color: theme.textPrimary }]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.settingRow, { marginTop: 15 }]}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Finansal Ay Başlangıcı</Text>
                    <View style={[styles.segmentContainer, { backgroundColor: theme.glassBorder }]}>
                        {[1, 15].map((day) => {
                            const isActive = userSettings.financialMonthStart === day;
                            return (
                                <TouchableOpacity
                                    key={day}
                                    style={[styles.segmentButton, isActive && styles.segmentActive]}
                                    onPress={() => updateSettings({ financialMonthStart: day })}
                                >
                                    <Text style={[styles.segmentText, { color: theme.textSecondary }, isActive && { color: theme.textPrimary, fontWeight: '600' }]}>{day}. Gün</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Regional Settings */}
                <View style={[styles.settingRow, { marginTop: 15 }]}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Bölge ve Saat Dilimi</Text>
                    <View style={[styles.segmentContainer, { backgroundColor: theme.glassBorder }]}>
                        {['TR', 'US', 'DE'].map((region) => {
                            const isActive = userSettings.region === region;
                            return (
                                <TouchableOpacity
                                    key={region}
                                    style={[styles.segmentButton, isActive && styles.segmentActive]}
                                    onPress={() => handleRegionChange(region)}
                                >
                                    <Text style={[styles.segmentText, { color: theme.textSecondary }, isActive && { color: theme.textPrimary, fontWeight: '600' }]}>{region}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={[styles.settingRow, { marginTop: 15 }]}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Tarih</Text>
                    <TouchableOpacity
                        style={[styles.inputField, { backgroundColor: theme.glassBorder }]}
                        onPress={() => { setPickerMode('date'); setPickerVisible(true); }}
                    >
                        <Text style={{ color: theme.textPrimary, fontSize: 16 }}>
                            {testDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>📅 (Değiştirmek için tıkla)</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.settingRow, { marginTop: 15 }]}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Saat Formatı</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[styles.segmentContainer, { backgroundColor: theme.glassBorder, flex: 1, height: 45 }]}>
                            {['24h', '12h'].map((format) => {
                                const isActive = userSettings.timeFormat === format;
                                return (
                                    <TouchableOpacity
                                        key={format}
                                        style={[styles.segmentButton, isActive && styles.segmentActive]}
                                        onPress={() => updateSettings({ timeFormat: format })}
                                    >
                                        <Text style={[styles.segmentText, { color: theme.textSecondary }, isActive && { color: theme.textPrimary, fontWeight: '600' }]}>{format}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity
                            style={[styles.inputField, { backgroundColor: theme.glassBorder, flex: 1, height: 45, justifyContent: 'center' }]}
                            onPress={() => { setPickerMode('time'); setPickerVisible(true); }}
                        >
                            <Text style={{ color: theme.textPrimary, fontSize: 16, textAlign: 'center' }}>
                                {testDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: userSettings.timeFormat === '12h' })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Bildirim Tercihleri</Text>
                <View style={styles.rowBetween}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Genel Bildirimler</Text>
                    <Switch
                        value={notificationSettings.general}
                        onValueChange={v => setNotificationSettings({ ...notificationSettings, general: v })}
                        trackColor={{ false: '#767577', true: COLORS.accentPurple }}
                    />
                </View>
                <View style={styles.rowBetween}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Anormallik Uyarıları</Text>
                    <Switch
                        value={notificationSettings.anomalies}
                        onValueChange={v => setNotificationSettings({ ...notificationSettings, anomalies: v })}
                        trackColor={{ false: '#767577', true: COLORS.accentPurple }}
                    />
                </View>
                <View style={styles.rowBetween}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Limit aşımları</Text>
                    <Switch
                        value={notificationSettings.limits}
                        onValueChange={v => setNotificationSettings({ ...notificationSettings, limits: v })}
                        trackColor={{ false: '#767577', true: COLORS.accentPurple }}
                    />
                </View>
            </View>
        </ScrollView>
    );

    const [notificationFilter, setNotificationFilter] = useState('all'); // all, payment, anomaly, spending, income
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const getFilteredNotifications = () => {
        let filtered = notifications;
        if (notificationFilter !== 'all') {
            filtered = filtered.filter(n => n.type === notificationFilter);
        }
        if (showUnreadOnly) {
            filtered = filtered.filter(n => !n.isRead);
        }
        return filtered;
    };

    const renderNotifications = () => {
        const filteredNotifications = getFilteredNotifications();

        return (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {renderHeader('Bildirimler')}

                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {[
                            { id: 'all', label: 'Tümü' },
                            { id: 'payment', label: 'Ödemeler' },
                            { id: 'anomaly', label: 'Anormallikler' },
                            { id: 'spending', label: 'Harcamalar' },
                            { id: 'income', label: 'Gelirler' },
                        ].map(filter => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: theme.glassBorder },
                                    notificationFilter === filter.id && styles.filterActive
                                ]}
                                onPress={() => setNotificationFilter(filter.id)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: theme.textSecondary },
                                    notificationFilter === filter.id && styles.filterTextActive
                                ]}>{filter.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        style={[styles.toggleButton, showUnreadOnly && styles.toggleActive, { borderColor: theme.glassBorder }]}
                        onPress={() => setShowUnreadOnly(!showUnreadOnly)}
                    >
                        <Text style={[styles.toggleText, { color: theme.textSecondary }, showUnreadOnly && { color: 'white' }]}>
                            {showUnreadOnly ? '✓ Sadece Okunmamış' : 'Sadece Okunmamış'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={[styles.linkText, { color: theme.accent }]}>Tümünü Okundu İşaretle</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.notificationList}>
                    {filteredNotifications.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bildirim bulunamadı.</Text>
                    ) : (
                        filteredNotifications.map(notif => (
                            <TouchableOpacity
                                key={notif.id}
                                style={[
                                    styles.notificationItem,
                                    { backgroundColor: theme.glassBorder },
                                    !notif.isRead && { borderLeftWidth: 3, borderLeftColor: theme.accent }
                                ]}
                                onPress={() => markAsRead(notif.id)}
                            >
                                <View style={styles.notifIconBox}>
                                    <Text style={{ fontSize: 20 }}>
                                        {notif.type === 'payment' ? '🧾' :
                                            notif.type === 'anomaly' ? '⚠️' :
                                                notif.type === 'income' ? '💰' : '💸'}
                                    </Text>
                                </View>
                                <View style={styles.notifContent}>
                                    <View style={styles.notifHeader}>
                                        <Text style={[styles.notifTitle, { color: theme.textPrimary }, !notif.isRead && { fontWeight: '700' }]}>
                                            {notif.title}
                                        </Text>
                                        <Text style={[styles.notifTime, { color: theme.textPrimary, opacity: 0.7 }]}>{notif.time}</Text>
                                    </View>
                                    <Text style={[styles.notifDesc, { color: theme.textPrimary, opacity: 0.8 }]}>{notif.desc}</Text>

                                    {/* Action Buttons */}
                                    <View style={styles.notifActions}>
                                        {notif.type === 'payment' && (
                                            <TouchableOpacity style={[styles.actionChip, { backgroundColor: theme.accent }]}>
                                                <Text style={styles.actionChipText}>Öde</Text>
                                            </TouchableOpacity>
                                        )}
                                        {(notif.type === 'anomaly' || notif.type === 'spending') && (
                                            <TouchableOpacity style={[styles.actionChip, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                                <Text style={[styles.actionChipText, { color: theme.textPrimary }]}>İncele</Text>
                                            </TouchableOpacity>
                                        )}
                                        {notif.type === 'income' && (
                                            <TouchableOpacity style={[styles.actionChip, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                                <Text style={[styles.actionChipText, { color: theme.textPrimary }]}>Detay</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    };

    const [expandedFAQs, setExpandedFAQs] = useState([]);

    const toggleFAQ = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedFAQs.includes(index)) {
            setExpandedFAQs(expandedFAQs.filter(i => i !== index));
        } else {
            setExpandedFAQs([...expandedFAQs, index]);
        }
    };

    const handleContactSupport = () => {
        setAlertConfig({
            title: 'Canlı Destek',
            message: 'Lütfen destek almak istediğiniz konuyu seçin:',
            buttons: [
                {
                    text: 'Hesap Sorunu',
                    onPress: () => {
                        setAlertVisible(false);
                        setTimeout(() => {
                            setAlertConfig({ title: 'Bağlanıyor...', message: 'Müşteri temsilcisine aktarılıyorsunuz (Hesap Sorunu).', buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }] });
                            setAlertVisible(true);
                        }, 500);
                    }
                },
                {
                    text: 'Teknik Hata',
                    onPress: () => {
                        setAlertVisible(false);
                        setTimeout(() => {
                            setAlertConfig({ title: 'Bağlanıyor...', message: 'Müşteri temsilcisine aktarılıyorsunuz (Teknik Hata).', buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }] });
                            setAlertVisible(true);
                        }, 500);
                    }
                },
                {
                    text: 'Genel Soru',
                    onPress: () => {
                        setAlertVisible(false);
                        setTimeout(() => {
                            setAlertConfig({ title: 'Bağlanıyor...', message: 'Müşteri temsilcisine aktarılıyorsunuz (Genel Soru).', buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }] });
                            setAlertVisible(true);
                        }, 500);
                    }
                },
                { text: 'İptal', style: 'cancel', onPress: () => setAlertVisible(false) }
            ]
        });
        setAlertVisible(true);
    };

    const handleEmailSupport = () => {
        const subject = 'Fincio Destek Talebi';
        const body = `\n\n\n---\nUygulama: Fincio v1.0.2\nCihaz: iOS\nKullanıcı: ${email}`;
        const url = `mailto:destek@fincio.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        Linking.openURL(url).catch(() => {
            setAlertConfig({
                title: 'Hata',
                message: 'E-posta uygulaması açılamadı.',
                buttons: [{ text: 'Tamam', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
        });
    };

    const faqData = [
        { q: 'Verilerim güvende mi?', a: 'Evet. Tüm verileriniz cihazınızda şifrelenerek saklanır.' },
        { q: 'Yedekleme yapabilir miyim?', a: 'Verileriniz bulutta şifreli olarak yedeklenir.' },
        { q: 'Banka hesabımı nasıl bağlarım?', a: 'Şu an için "Hesaplar" sekmesinden bakiyelerinizi manuel olarak ekleyebilir ve güncelleyebilirsiniz.' },
        { q: 'Fincio Skoru nedir?', a: 'Varlıklarınız ve borçlarınıza göre hesaplanan finansal sağlık puanınızdır.' }
    ];

    const renderSupport = () => (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {renderHeader('Yardım ve Destek')}

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Sıkça Sorulan Sorular</Text>
                {faqData.map((item, i) => {
                    const isExpanded = expandedFAQs.includes(i);
                    return (
                        <View key={i} style={[styles.faqItem, { borderBottomColor: theme.glassBorder, flexDirection: 'column', alignItems: 'stretch' }]}>
                            <TouchableOpacity onPress={() => toggleFAQ(i)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.faqQuestion, { color: theme.textPrimary, flex: 1 }]}>{item.q}</Text>
                                <Text style={[styles.arrow, { color: theme.textSecondary, transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }]}>›</Text>
                            </TouchableOpacity>
                            {isExpanded && (
                                <Text style={[styles.faqAnswer, { color: theme.textPrimary }]}>
                                    {item.a}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>İletişim</Text>
                <TouchableOpacity style={[styles.contactButton, { backgroundColor: theme.glassBorder }]} onPress={handleContactSupport}>
                    <Text style={styles.contactIcon}>💬</Text>
                    <Text style={[styles.contactText, { color: theme.textPrimary }]}>Canlı Destek Başlat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.contactButton, { backgroundColor: theme.glassBorder }]} onPress={handleEmailSupport}>
                    <Text style={styles.contactIcon}>✉️</Text>
                    <Text style={[styles.contactText, { color: theme.textPrimary }]}>E-posta Gönder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.contactButton, { backgroundColor: theme.glassBorder, marginTop: 10 }]}
                    onPress={() => {
                        setAlertConfig({
                            title: 'Tur Yeniden Başlatılsın mı?',
                            message: 'Uygulama tanıtım turunu tekrar izlemek istiyor musunuz?',
                            buttons: [
                                { text: 'Vazgeç', style: 'cancel', onPress: () => setAlertVisible(false) },
                                {
                                    text: 'Başlat',
                                    onPress: () => {
                                        setAlertVisible(false);
                                        setFirstLoginDone(false);
                                        setOnboardingStep(1);
                                        setCurrentScreen('Home');
                                        onClose();
                                    }
                                }
                            ]
                        });
                        setAlertVisible(true);
                    }}
                >
                    <Text style={styles.contactIcon}>🚀</Text>
                    <Text style={[styles.contactText, { color: theme.textPrimary }]}>Tanıtım Turunu Yeniden Başlat</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footerInfo}>
                <Text style={styles.versionText}>Fincio v1.0.2</Text>
                <TouchableOpacity onPress={() => Alert.alert('Gizlilik Politikası', 'Gizlilik politikası metni burada yer alacak...')}>
                    <Text style={styles.linkText}>Gizlilik Politikası</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Kullanım Koşulları', 'Kullanım koşulları metni burada yer alacak...')}>
                    <Text style={styles.linkText}>Kullanım Koşulları</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 10 }} onPress={() => Alert.alert('Geri Bildirim', 'Görüşleriniz bizim için değerli! Lütfen önerilerinizi yazın.')}>
                    <Text style={[styles.linkText, { color: theme.accent, fontWeight: '600' }]}>Geri Bildirim Gönder</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderManageAccounts = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {renderHeader('Banka Hesapları')}

            <View style={styles.section}>
                <Text style={[styles.descText, { color: theme.textPrimary, opacity: 0.8 }]}>
                    Bu bölüm, finansal kontrolünüz için uygulamaya kaydettiğiniz tüm banka ve kredi kartı hesaplarının listesidir.
                    Uygulama, maliyet veya güvenlik sebebiyle bu hesaplara otomatik olarak bağlanmaz ve veri çekmez.
                </Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.glassBorder, borderColor: theme.glassBorder }]} onPress={() => setShowAddAccount(!showAddAccount)}>
                    <Text style={styles.addButtonText}>{showAddAccount ? 'İptal' : '➕ Yeni Hesap Ekle'}</Text>
                </TouchableOpacity>

                {showAddAccount && (
                    <View style={[styles.addForm, { backgroundColor: theme.glassBorder, borderColor: theme.glassBorder }]}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Hesap Adı (Örn: X Bankası)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
                            value={newAccountName}
                            onChangeText={setNewAccountName}
                            placeholder="Hesap Adı"
                            placeholderTextColor={theme.textSecondary}
                        />

                        <Text style={[styles.inputLabel, { marginTop: 10, color: theme.textSecondary }]}>Hesap Tipi</Text>
                        <View style={styles.typeSelector}>
                            {['Banka', 'Kredi Kartı', 'Yatırım'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeOption, newAccountType === type && styles.typeOptionActive]}
                                    onPress={() => setNewAccountType(type)}
                                >
                                    <Text style={[styles.typeText, newAccountType === type && styles.typeTextActive]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: 10, color: theme.textSecondary }]}>Başlangıç Bakiyesi (₺)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
                            value={newAccountBalance}
                            onChangeText={setNewAccountBalance}
                            placeholder="0"
                            keyboardType="numeric"
                            placeholderTextColor={theme.textSecondary}
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={handleAddAccount}>
                            <Text style={styles.saveButtonTextLarge}>Hesabı Kaydet</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.accent }]}>Kayıtlı Hesaplar</Text>
                {accounts.map(acc => (
                    <View key={acc.id} style={[styles.accountItem, { backgroundColor: theme.glassBorder, borderColor: theme.glassBorder }]}>
                        <View style={[styles.accountIconBox, { backgroundColor: theme.glassBorder }]}>
                            <Text style={styles.accountIcon}>{acc.type === 'Banka' ? '🏦' : acc.type === 'Kredi Kartı' ? '💳' : '📈'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.accountName, { color: theme.textPrimary }]}>{acc.name}</Text>
                            <Text style={[styles.accountType, { color: theme.textPrimary, opacity: 0.8 }]}>{acc.type}</Text>
                        </View>
                        <View style={styles.accountRight}>
                            <Text style={[styles.accountBalance, { color: acc.balance < 0 ? COLORS.accentRed : COLORS.accentGreen }]}>
                                ₺{acc.balance.toLocaleString()}
                            </Text>
                            <TouchableOpacity onPress={() => deleteAccount(acc.id)} style={styles.deleteButton}>
                                <Text style={styles.deleteButtonText}>Sil</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderChangePassword = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {renderHeader('Şifre Değiştir')}

            <View style={styles.section}>
                <Text style={[styles.descText, { color: theme.textPrimary, opacity: 0.8 }]}>
                    Hesap güvenliğiniz için güçlü bir şifre seçmenizi öneririz.
                </Text>
            </View>

            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mevcut Şifre</Text>
                    <TextInput
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni Şifre</Text>
                    <TextInput
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni Şifre (Tekrar)</Text>
                    <TextInput
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
                    <Text style={styles.saveButtonTextLarge}>Şifreyi Güncelle</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'profile': return renderProfile();
            case 'settings': return renderSettings();
            case 'notifications': return renderNotifications();
            case 'support': return renderSupport();
            case 'manageAccounts': return renderManageAccounts();
            case 'changePassword': return renderChangePassword();
            default: return renderMenu();
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={activeView === 'menu' ? onClose : handleBack} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>{activeView === 'menu' ? 'Kapat' : '← Geri'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil & Ayarlar</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.mainContainer}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {activeView === 'menu' && renderMenu()}
                        {activeView === 'profile' && renderProfile()}
                        {activeView === 'settings' && renderSettings()}
                        {activeView === 'notifications' && renderNotifications()}
                        {activeView === 'support' && renderSupport()}
                        {activeView === 'manageAccounts' && renderManageAccounts && renderManageAccounts()}
                        {activeView === 'changePassword' && renderChangePassword && renderChangePassword()}

                        {/* Bottom Spacer */}
                        <View style={{ height: 50 }} />
                    </ScrollView>
                </View>
            </SafeAreaView>

            <CustomDatePicker
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onSelect={handlePickerSelect}
                mode={pickerMode}
                initialDate={testDate}
            />

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0f172a', // Main Dark Theme Background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#0f172a',
        zIndex: 10,
    },
    headerButton: {
        padding: 5,
        minWidth: 60,
    },
    headerButtonText: {
        color: '#94a3b8', // slate-400
        fontSize: 16,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerRight: {
        minWidth: 60,
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    // --- Menu Styles ---
    title: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 15,
        marginTop: 10,
        textTransform: 'uppercase',
        opacity: 0.7,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    icon: {
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    label: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    desc: {
        color: '#94a3b8',
        fontSize: 13,
    },
    arrow: {
        color: '#94a3b8',
        fontSize: 18,
        opacity: 0.5,
    },
    // --- Section Styles ---
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        color: '#3b82f6', // accentBlue
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#e2e8f0',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        color: 'white',
    },
    actionButton: {
        padding: 15,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButtonSmall: {
        backgroundColor: '#10b981', // accentGreen
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    // --- Settings Styles ---
    settingRow: {
        marginBottom: 25,
    },
    rowLabel: {
        color: 'white',
        fontSize: 16,
        marginBottom: 10,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 4,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentActive: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    segmentText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    colorPalette: {
        flexDirection: 'row',
        gap: 15,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionActive: {
        borderColor: 'white',
    },
    checkIcon: {
        color: 'white',
        fontWeight: 'bold',
    },
    currencySelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: 4,
    },
    currencyOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    currencyActive: {
        backgroundColor: '#3b82f6',
    },
    currencyText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: 'bold',
    },
    // --- Notification Styles ---
    filterContainer: {
        marginBottom: 15,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    filterActive: {
        backgroundColor: '#3b82f6',
    },
    filterText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    filterTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleActive: {
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    toggleText: {
        fontSize: 12,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    notifIconBox: {
        marginRight: 15,
        justifyContent: 'center',
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    notifTime: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 6,
        textAlign: 'right',
    },
    notifDesc: {
        color: '#cbd5e1',
        fontSize: 13,
        lineHeight: 18,
    },
    notifActions: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10,
    },
    actionChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    actionChipText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    // --- FAQ Styles ---
    faqItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    faqQuestion: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 14,
        lineHeight: 22,
        color: '#cbd5e1',
        paddingRight: 10,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    contactIcon: {
        fontSize: 22,
        marginRight: 15,
    },
    contactText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    // --- Logout ---
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        marginTop: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    logoutText: {
        color: '#ef4444',
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    // --- Account Management Styles ---
    addButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    addButtonText: {
        color: '#3b82f6',
        fontWeight: '600',
        fontSize: 14,
    },
    addForm: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 15,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    typeOption: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typeOptionActive: {
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    typeText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    typeTextActive: {
        color: '#3b82f6',
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonTextLarge: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    accountIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    accountIcon: {
        fontSize: 20,
    },
    accountName: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 2,
    },
    accountType: {
        color: '#94a3b8',
        fontSize: 12,
    },
    accountRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    accountBalance: {
        fontWeight: '700',
        fontSize: 15,
    },
    deleteButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 6,
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '600',
    },
    descText: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 20,
    },
});

export default ProfileModal;
