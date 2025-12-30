import React, { useState, useRef, useContext } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from './src/constants/theme';
import Svg, { Circle } from 'react-native-svg';
import FinancialHealth from './src/components/FinancialHealth';
import DebtsSection from './src/components/DebtsSection';
import DynamicSummary from './src/components/DynamicSummary';
import BottomNavigation from './src/components/BottomNavigation';
import PaymentsScreen from './src/screens/PaymentsScreen';
import InvestmentsScreen from './src/screens/InvestmentsScreen';
import IncomeScreen from './src/screens/IncomeScreen';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import QuickAddModal from './src/components/QuickAddModal';
import ProfileModal from './src/components/ProfileModal';
import { DataContext, DataProvider } from './src/context/DataContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Auth Navigation - Shows Login or SignUp based on state
const AuthNavigator = () => {
  const [currentAuthScreen, setCurrentAuthScreen] = useState('login');

  if (currentAuthScreen === 'login') {
    return (
      <LoginScreen
        onNavigateToSignUp={() => setCurrentAuthScreen('signup')}
      />
    );
  }

  return (
    <SignUpScreen
      onNavigateToLogin={() => setCurrentAuthScreen('login')}
    />
  );
};

// Main App Content that consumes Context
const AppContent = () => {
  const { currentScreen, setCurrentScreen, userProfile, theme } = useContext(DataContext);
  const { user, getUserProfile } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isQuickAddVisible, setIsQuickAddVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [userName, setUserName] = useState('');

  // Fetch user name from Firestore on mount
  React.useEffect(() => {
    const fetchUserName = async () => {
      if (user?.uid) {
        const profile = await getUserProfile();
        if (profile?.firstName) {
          setUserName(profile.firstName);
        } else if (profile?.displayName) {
          setUserName(profile.displayName.split(' ')[0]);
        }
      }
    };
    fetchUserName();
  }, [user?.uid, getUserProfile]);

  // Scroll Refs
  const homeScrollRef = useRef(null);
  const paymentsScrollRef = useRef(null);
  const investmentsScrollRef = useRef(null);
  const incomeScrollRef = useRef(null);

  const handleHeaderPress = () => {
    if (currentScreen === 'Home') {
      homeScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentScreen === 'Payments') {
      paymentsScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentScreen === 'Investments') {
      investmentsScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentScreen === 'Income') {
      incomeScrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const renderContent = () => {
    if (currentScreen === 'Payments') {
      return <PaymentsScreen scrollViewRef={paymentsScrollRef} />;
    }
    if (currentScreen === 'Investments') {
      return <InvestmentsScreen scrollViewRef={investmentsScrollRef} />;
    }
    if (currentScreen === 'Income') {
      return <IncomeScreen scrollViewRef={incomeScrollRef} />;
    }

    return (
      <ScrollView
        ref={homeScrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FinancialHealth />
        <DebtsSection />
        <DynamicSummary />
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            {userName ? (
              <Text style={styles.welcomeText}>Merhaba, {userName} 👋</Text>
            ) : null}
            <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.7}>
              <Text style={styles.headerTitle}>Fincio</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Icon with Score Ring */}
          <TouchableOpacity onPress={() => setIsProfileVisible(true)} style={styles.profileContainer}>
            <View style={styles.ringContainer}>
              <Svg height="44" width="44" viewBox="0 0 44 44">
                {/* Background Ring */}
                <Circle cx="22" cy="22" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                {/* Score Ring (85%) */}
                <Circle
                  cx="22"
                  cy="22"
                  r="20"
                  stroke={COLORS.accentGreen}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${0.85 * 125} 125`}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="22, 22"
                />
              </Svg>
              <View style={styles.profileIconCenter}>
                <Text style={styles.profileIcon}>👤</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {renderContent()}

        <BottomNavigation
          activeTab={currentScreen}
          onNavigate={setCurrentScreen}
          onOpenQuickAdd={() => setIsQuickAddVisible(true)}
        />

        <QuickAddModal
          visible={isQuickAddVisible}
          onClose={() => setIsQuickAddVisible(false)}
        />

        <ProfileModal
          visible={isProfileVisible}
          onClose={() => setIsProfileVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
};

// Root Navigator - Checks auth state and renders appropriate screens
const RootNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.accentGreen} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Show main app if authenticated
  return (
    <DataProvider userId={user?.uid}>
      <AppContent />
    </DataProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.accentGreen,
    marginBottom: 2,
    fontWeight: '500',
  },
  profileContainer: {
    // Container for touchable area
  },
  ringContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileIconCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
});
