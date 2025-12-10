import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const presets = [
  { name: 'Box', inhale: 4, hold: 4, exhale: 4, hold2: 4 },
  { name: '4-7-8', inhale: 4, hold: 7, exhale: 8, hold2: 0 },
  { name: 'Coherent', inhale: 5, hold: 0, exhale: 5, hold2: 0 },
  { name: 'Anti-Stress', inhale: 4, hold: 2, exhale: 6, hold2: 0 },
];

export default function App() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('inhale');
  const circleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const currentPreset = presets[presetIndex];

  // Criação de partículas
  const numParticles = 20;
  const particles = useRef(
    Array.from({ length: numParticles }).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      size: Math.random() * 6 + 4,
      opacity: new Animated.Value(Math.random() * 0.5 + 0.2),
      speed: Math.random() * 20000 + 15000,
      color: `hsl(${Math.random() * 360}, 70%, 80%)`,
    }))
  ).current;

  const animateParticle = (p) => {
    p.y.setValue(height + p.size);
    Animated.timing(p.y, {
      toValue: -p.size,
      duration: p.speed,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => animateParticle(p));
  };

  useEffect(() => {
    particles.forEach(p => animateParticle(p));
  }, []);

  // Animação do círculo
  const animateCircle = (duration, expand = true) => {
    Animated.timing(circleAnim, {
      toValue: expand ? 1 : 0,
      duration: duration * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: duration * 500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: duration * 500, useNativeDriver: true }),
      ])
    ).start();
  };

  // Vibração
  const vibrate = () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Ciclo de respiração
  useEffect(() => {
    let timer;
    if (running) {
      const runPhase = (currentPhase) => {
        let duration = 0;
        switch (currentPhase) {
          case 'inhale': duration = currentPreset.inhale; break;
          case 'hold': duration = currentPreset.hold; break;
          case 'exhale': duration = currentPreset.exhale; break;
          case 'hold2': duration = currentPreset.hold2; break;
        }

        if (duration > 0) {
          if (currentPhase === 'inhale') animateCircle(duration, true);
          if (currentPhase === 'exhale') animateCircle(duration, false);
          vibrate();
          timer = setTimeout(() => {
            const nextPhase = getNextPhase(currentPhase);
            setPhase(nextPhase);
          }, duration * 1000);
        } else {
          const nextPhase = getNextPhase(currentPhase);
          setPhase(nextPhase);
        }
      };

      runPhase(phase);
    }
    return () => clearTimeout(timer);
  }, [running, phase, presetIndex]);

  const getNextPhase = (currentPhase) => {
    switch (currentPhase) {
      case 'inhale': return 'hold';
      case 'hold': return 'exhale';
      case 'exhale': return 'hold2';
      case 'hold2': return 'inhale';
      default: return 'inhale';
    }
  };

  const toggleSession = () => {
    setRunning(!running);
    if (!running) setPhase('inhale');
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Inhale...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Exhale...';
      case 'hold2': return 'Hold...';
      default: return '';
    }
  };

  const getCircleColor = () => {
    switch (phase) {
      case 'inhale': return '#a8edea';
      case 'hold': return '#fed6e3';
      case 'exhale': return '#a1c4fd';
      case 'hold2': return '#fbc2eb';
      default: return '#ffffff';
    }
  };

  return (
    <LinearGradient colors={['#89f7fe', '#66a6ff']} style={styles.container}>
      <Text style={styles.title}>PulseZen</Text>

      {/* Partículas coloridas flutuantes */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }],
          }}
        />
      ))}

      {/* Círculo animado com glow */}
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: getCircleColor() + '80',
            transform: [{ scale: circleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
            shadowColor: getCircleColor(),
            shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] }),
            shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 40] }),
          },
        ]}
      />

      <Text style={styles.phaseText}>{getPhaseText()}</Text>

      <View style={styles.presets}>
        {presets.map((p, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setPresetIndex(i)}
            style={[styles.presetButton, presetIndex === i && styles.activePreset]}
          >
            <Text style={styles.presetText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={toggleSession} style={styles.startButton} activeOpacity={0.7}>
        <Text style={styles.startButtonText}>{running ? 'Parar' : 'Iniciar'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 36, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
  circle: { width: 220, height: 220, borderRadius: 110, marginBottom: 20 },
  presets: { flexDirection: 'row', marginBottom: 20 },
  presetButton: { padding: 10, margin: 5, backgroundColor: '#fff', borderRadius: 10 },
  activePreset: { backgroundColor: '#6fa1ff' },
  presetText: { fontSize: 14 },
  startButton: { padding: 15, backgroundColor: '#3b5998', borderRadius: 10, marginBottom: 20 },
  startButtonText: { color: '#fff', fontSize: 18 },
  phaseText: { fontSize: 22, color: '#fff', marginBottom: 10 },
});
