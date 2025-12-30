import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';
import { DataContext } from '../context/DataContext';

const CustomDatePicker = ({ visible, onClose, onSelect, mode = 'date', title, initialDate }) => {
    const { theme } = useContext(DataContext);
    const [tempDate, setTempDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (visible) {
            const dateToUse = initialDate ? new Date(initialDate) : new Date();
            setTempDate(dateToUse);
            setViewDate(dateToUse);
        }
    }, [visible, initialDate]);

    const changeMonth = (increment) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setViewDate(newDate);
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(viewDate);
        newDate.setDate(day);
        setTempDate(newDate);
    };

    const handleTimeSelect = (hour, minute) => {
        const newDate = new Date(tempDate);
        newDate.setHours(hour);
        newDate.setMinutes(minute);
        setTempDate(newDate);
    };

    const handleSave = () => {
        onSelect(tempDate);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={[styles.pickerContainer, { backgroundColor: 'transparent' }]}>
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.pickerHeader}>
                    <Text style={[styles.pickerTitle, { color: theme.textPrimary }]}>
                        {title || (mode === 'date' ? 'Tarih Seç' : 'Saat Seç')}
                    </Text>
                </View>

                <ScrollView contentContainerStyle={styles.pickerContent}>
                    {mode === 'date' ? (
                        <View>
                            <View style={styles.calendarHeader}>
                                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
                                    <Text style={[styles.monthNavText, { color: theme.textPrimary }]}>{'<'}</Text>
                                </TouchableOpacity>
                                <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
                                    {viewDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                </Text>
                                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
                                    <Text style={[styles.monthNavText, { color: theme.textPrimary }]}>{'>'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.calendarGrid}>
                                {Array.from({ length: getDaysInMonth(viewDate) }, (_, i) => i + 1).map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            styles.calendarDay,
                                            tempDate.getDate() === day &&
                                            tempDate.getMonth() === viewDate.getMonth() &&
                                            tempDate.getFullYear() === viewDate.getFullYear() &&
                                            { backgroundColor: theme.accent }
                                        ]}
                                        onPress={() => handleDateSelect(day)}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            {
                                                color: (tempDate.getDate() === day &&
                                                    tempDate.getMonth() === viewDate.getMonth() &&
                                                    tempDate.getFullYear() === viewDate.getFullYear()) ? 'white' : theme.textPrimary
                                            }
                                        ]}>{day}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.timeList}>
                            <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Saat</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                                {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                                    <TouchableOpacity
                                        key={hour}
                                        style={[styles.timeItem, tempDate.getHours() === hour && { backgroundColor: theme.accent }]}
                                        onPress={() => handleTimeSelect(hour, tempDate.getMinutes())}
                                    >
                                        <Text style={[styles.timeText, { color: tempDate.getHours() === hour ? 'white' : theme.textPrimary }]}>
                                            {hour.toString().padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.timeLabel, { color: theme.textSecondary, marginTop: 20 }]}>Dakika</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                                {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => (
                                    <TouchableOpacity
                                        key={minute}
                                        style={[styles.timeItem, tempDate.getMinutes() === minute && { backgroundColor: theme.accent }]}
                                        onPress={() => handleTimeSelect(tempDate.getHours(), minute)}
                                    >
                                        <Text style={[styles.timeText, { color: tempDate.getMinutes() === minute ? 'white' : theme.textPrimary }]}>
                                            {minute.toString().padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.pickerFooter}>
                    <TouchableOpacity onPress={onClose} style={[styles.footerButton, { backgroundColor: theme.glassBorder }]}>
                        <Text style={[styles.footerButtonText, { color: theme.textSecondary }]}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} style={[styles.footerButton, { backgroundColor: theme.accent }]}>
                        <Text style={[styles.footerButtonText, { color: 'white', fontWeight: 'bold' }]}>Kaydet</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    pickerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 40,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    pickerContent: {
        padding: 20,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthNavButton: {
        padding: 10,
    },
    monthNavText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    calendarDay: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dayText: {
        fontSize: 14,
    },
    timeList: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 14,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    timeScroll: {
        flexGrow: 0,
    },
    timeItem: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    pickerFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CustomDatePicker;
