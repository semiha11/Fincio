import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const EditModal = ({ visible, onClose, onSave, onDelete, title, fields, initialData }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({});
        }
    }, [initialData, visible]);

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.container, { backgroundColor: 'transparent' }]}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <Text style={styles.title}>{title}</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {fields.map((field) => (
                                <View key={field.key} style={styles.inputGroup}>
                                    <Text style={styles.label}>{field.label}</Text>

                                    {field.type === 'select' ? (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                                            {field.options.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.optionButton,
                                                        formData[field.key] === option && styles.selectedOption
                                                    ]}
                                                    onPress={() => handleChange(field.key, option)}
                                                >
                                                    <Text style={[
                                                        styles.optionText,
                                                        formData[field.key] === option && styles.selectedOptionText
                                                    ]}>{option}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    ) : (
                                        <TextInput
                                            style={styles.input}
                                            value={formData[field.key] ? String(formData[field.key]) : ''}
                                            onChangeText={(text) => handleChange(field.key, text)}
                                            placeholder={field.placeholder}
                                            placeholderTextColor={COLORS.textSecondary}
                                            keyboardType={field.keyboardType || 'default'}
                                            autoFocus={field.autoFocus}
                                        />
                                    )}
                                </View>
                            ))}

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            </TouchableOpacity>

                            {onDelete && (
                                <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                                    <Text style={styles.deleteButtonText}>Sil</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalContent: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        padding: 20,
        minHeight: 200,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 5,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: COLORS.accentGreen,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    deleteButtonText: {
        color: COLORS.accentRed,
        fontWeight: '600',
        fontSize: 16,
    },
    optionsContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    optionButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedOption: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: COLORS.accentGreen,
    },
    optionText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    selectedOptionText: {
        color: COLORS.accentGreen,
        fontWeight: '600',
    },
});

export default EditModal;
