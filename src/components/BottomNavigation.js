import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { DataContext } from '../context/DataContext';
import { useContext } from 'react';
import OnboardingTooltip from './OnboardingTooltip';

const { width } = Dimensions.get('window');

const BottomNavigation = ({ activeTab, onNavigate, onOpenQuickAdd }) => {
    const { theme, setOnboardingStep, setFirstLoginDone } = useContext(DataContext);
    return (
        <View style={styles.container}>
            <BlurView intensity={80} tint="dark" style={[styles.navBar, { backgroundColor: theme.cardBg, borderTopColor: theme.glassBorder }]}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => onNavigate('Home')}
                >
                    <Text style={styles.navIcon}>🏠</Text>
                    <Text style={[styles.navLabel, { color: activeTab === 'Home' ? theme.accent : theme.textSecondary }]}>Özet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => onNavigate('Payments')}
                >
                    <Text style={styles.navIcon}>🧾</Text>
                    <Text style={[styles.navLabel, { color: activeTab === 'Payments' ? theme.accent : theme.textSecondary }]}>Ödemeler</Text>
                </TouchableOpacity>

                <View style={styles.fabContainer}>
                    <OnboardingTooltip
                        step={7}
                        content="Bu Hızlı Ekleme butonuna basarak her yerden kolayca gelir veya harcama ekleyebilirsiniz."
                        placement="top"
                        onNextOverride={() => {
                            setOnboardingStep(0);
                            setFirstLoginDone(true);
                        }}
                    >
                        <LinearGradient
                            colors={['#2dd4bf', '#3b82f6']} // Teal to Blue gradient
                            style={styles.fab}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <TouchableOpacity style={styles.fabButton} onPress={onOpenQuickAdd}>
                                <Text style={styles.fabIcon}>+</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </OnboardingTooltip>
                </View>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => onNavigate('Investments')}
                >
                    <Text style={styles.navIcon}>📈</Text>
                    <Text style={[styles.navLabel, { color: activeTab === 'Investments' ? theme.accent : theme.textSecondary }]}>Yatırımlar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => onNavigate('Income')}
                >
                    <Text style={styles.navIcon}>💸</Text>
                    <Text style={[styles.navLabel, { color: activeTab === 'Income' ? theme.accent : theme.textSecondary }]}>Gelirler</Text>
                </TouchableOpacity>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 30,
        paddingTop: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderTopWidth: 1,
        borderTopColor: COLORS.glassBorder,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    navLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: '500',
    },
    fabContainer: {
        top: -30, // Move it up to float
        shadowColor: '#2dd4bf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    fab: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabIcon: {
        fontSize: 40,
        color: '#1e293b', // Dark color for the icon
        fontWeight: '400', // Thinner weight as seen in image
        marginTop: -4, // Optical centering
    },
});

export default BottomNavigation;
