import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { DataContext } from '../context/DataContext';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUBBLE_WIDTH = 280;

const OnboardingTooltip = ({ step, content, placement = 'bottom', children, onNextOverride }) => {
    const { onboardingStep, setOnboardingStep, theme } = useContext(DataContext);
    const [tooltipLayout, setTooltipLayout] = React.useState(null);
    const containerRef = React.useRef(null);

    const isActive = onboardingStep === step;

    React.useEffect(() => {
        if (isActive && containerRef.current) {
            // Include a small delay to ensure layout is final, especially during transitions
            setTimeout(() => {
                containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    setTooltipLayout({ x: pageX, y: pageY, width, height });
                });
            }, 100);
        }
    }, [isActive]);

    const handleNext = () => {
        if (onNextOverride) {
            onNextOverride();
        } else {
            setOnboardingStep(prev => prev + 1);
        }
    };

    // Calculation Logic
    let tooltipStyle = {};
    let arrowTransform = [];

    if (tooltipLayout) {
        const targetCenterX = tooltipLayout.x + (tooltipLayout.width / 2);

        // Calculate horizontal position (clamped to screen)
        const idealLeft = targetCenterX - (BUBBLE_WIDTH / 2);
        const maxLeft = SCREEN_WIDTH - BUBBLE_WIDTH - 20; // 20px padding from right
        const finalLeft = Math.max(20, Math.min(idealLeft, maxLeft)); // 20px padding from left

        // Calculate arrow offset to keep pointing at target
        // The arrow is centered by default in the bubble (at width/2 = 140)
        // We need to shift it to match the difference between ideal and final position
        const arrowShift = idealLeft - finalLeft;

        tooltipStyle = {
            left: finalLeft,
            top: placement === 'bottom'
                ? tooltipLayout.y + tooltipLayout.height + 10
                : tooltipLayout.y - 10,
        };

        // Combine existing arrow rotation with new translateX
        if (placement === 'bottom') {
            arrowTransform = [{ translateX: arrowShift }];
        } else {
            arrowTransform = [{ rotate: '180deg' }, { translateX: arrowShift }];
        }
    }

    return (
        <View ref={containerRef} style={{ zIndex: isActive ? 9999 : 1 }}>
            {children}

            <Modal
                transparent={true}
                visible={isActive && !!tooltipLayout}
                animationType="fade"
                onRequestClose={() => { }} // Block back button
            >
                {/* Full screen touchable to block interaction elsewhere if needed, or just let it be transparent */}
                <View style={styles.modalOverlay}>
                    {!!tooltipLayout && (
                        <View style={[
                            styles.tooltipContainer,
                            tooltipStyle
                        ]}>
                            <View style={[
                                styles.tooltipContentWrapper,
                                placement === 'bottom' ? {} : { transform: [{ translateY: -180 }] } // Adjusted estimate for Top
                            ]}>
                                {/* Arrow */}
                                <View style={[
                                    styles.arrow,
                                    placement === 'bottom' ? styles.arrowTop : styles.arrowBottom,
                                    {
                                        borderBottomColor: 'rgba(30, 41, 59, 0.95)',
                                        transform: arrowTransform
                                    }
                                ]} />

                                <View style={styles.bubble}>
                                    <View style={styles.header}>
                                        <Text style={styles.stepText}>İpucu {step}</Text>
                                        <TouchableOpacity onPress={() => setOnboardingStep(0)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Text style={styles.closeText}>Kapat</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.content}>{content}</Text>

                                    <TouchableOpacity style={[styles.nextButton, { backgroundColor: theme.accent }]} onPress={handleNext}>
                                        <Text style={[styles.nextButtonText, { color: 'white' }]}>➜</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)', // Slight dim to focus attention
    },
    tooltipContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'visible',
    },
    tooltipContentWrapper: {
        alignItems: 'center',
    },
    bubble: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 15,
        width: 280,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    stepText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    closeText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    content: {
        color: 'white',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 15,
    },
    nextButton: {
        backgroundColor: COLORS.accentGreen,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
    nextButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    arrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'rgba(30, 41, 59, 0.95)',
        marginBottom: 0, // Should be separate from bubble
        zIndex: 1001,
    },
    arrowTop: {
        // Points up
    },
    arrowBottom: {
        transform: [{ rotate: '180deg' }],
        marginTop: -1, // overlap
        top: '100%'
        // Note: For Top placement, the arrow should be below the bubble. 
        // This styling logic needs to match the new structure.
        // In previous structure arrow was inside absolute view.
        // Here arrow is sibling of bubble in a wrapper.
    }
});

export default OnboardingTooltip;
