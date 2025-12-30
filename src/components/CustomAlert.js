import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../constants/theme';
import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, buttons = [], onClose }) => {
    const { theme } = useContext(DataContext);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={[styles.alertContainer, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    {/* Title & Message */}
                    <View style={styles.contentContainer}>
                        {title && <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>}
                        {message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {buttons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    { borderTopColor: theme.glassBorder },
                                    index === 0 && { borderTopWidth: 1 } // Add border to first button to separate from content
                                ]}
                                onPress={() => {
                                    if (btn.onPress) btn.onPress();
                                    // We don't automatically close here to allow for specific flows, 
                                    // but usually the parent handles closing or the button action does.
                                    // If it's a simple "OK" or "Cancel", the parent should pass a close handler.
                                }}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    { color: theme.accent }, // Default color
                                    btn.style === 'destructive' && { color: COLORS.accentRed },
                                    btn.style === 'cancel' && { fontWeight: '600' }
                                ]}>
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    alertContainer: {
        width: width * 0.8,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    contentContainer: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        width: '100%',
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '400',
    }
});

export default CustomAlert;
