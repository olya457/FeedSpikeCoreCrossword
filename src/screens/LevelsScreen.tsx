import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Levels'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 750;
const IS_TINY = H < 690;
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background.png');
const COIN = require('../assets/coin.png');

const TOTAL = 50;

const STORAGE_FRUITS = 'spike_fruits_v1';
const STORAGE_DONE_LEVELS = 'crossword_done_levels_v1';
const STORAGE_UNLOCKED = 'crossword_unlocked_v1';

function safeParseNumberArray(raw: string | null): number[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    return v.map(Number).filter(n => Number.isFinite(n));
  } catch {
    return [];
  }
}

export default function LevelsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [unlocked, setUnlocked] = useState(1);
  const [done, setDone] = useState<number[]>([]);
  const [fruits, setFruits] = useState(0);

  const levels = useMemo(() => Array.from({ length: TOTAL }, (_, i) => i + 1), []);
  const doneSet = useMemo(() => new Set(done), [done]);

  const topPad = insets.top + (IS_VERY_TINY ? 6 : 10);

  const COLS = IS_VERY_TINY ? 5 : IS_TINY ? 5 : 6;
  const GAP = IS_VERY_TINY ? 8 : IS_TINY ? 9 : 10;
  const PAD = 18;

  const cell = Math.floor((W - PAD * 2 - GAP * (COLS - 1)) / COLS);
  const SIZE = Math.max(IS_VERY_TINY ? 42 : 44, Math.min(cell, IS_SMALL ? 58 : 62));

  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [a]);

  const loadProgress = async () => {
    try {
      const [[, rawDone], [, rawUnlocked], [, rawFruits]] = await AsyncStorage.multiGet([
        STORAGE_DONE_LEVELS,
        STORAGE_UNLOCKED,
        STORAGE_FRUITS,
      ]);

      const doneArr = safeParseNumberArray(rawDone);

      const unlockedNum = rawUnlocked ? Number(rawUnlocked) : 1;
      const safeUnlocked =
        Number.isFinite(unlockedNum) ? Math.max(1, Math.min(TOTAL, unlockedNum)) : 1;

      const fixedFruits = doneArr.length;

      setDone(doneArr);
      setUnlocked(safeUnlocked);
      setFruits(fixedFruits);

      const fruitsFromStorage = rawFruits ? Number(rawFruits) : fixedFruits;
      if (Number.isFinite(fruitsFromStorage) && fruitsFromStorage !== fixedFruits) {
        await AsyncStorage.setItem(STORAGE_FRUITS, String(fixedFruits));
      }
    } catch {

    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
    }, []),
  );

  const onOpenLevel = (lvl: number) => {
    if (lvl > unlocked) return;
    navigation.navigate('LevelPlay', { level: lvl } as any);
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <Animated.View
        style={{
          flex: 1,
          opacity: a,
          transform: [
            {
              translateY: a.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        }}
      >
        <View style={[styles.header, { paddingTop: topPad }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.title}>Crossword</Text>

          <View style={styles.counterPill}>
            <Image source={COIN} style={styles.counterIcon} resizeMode="contain" />
            <Text style={styles.counterText}>{fruits}</Text>
          </View>
        </View>

        <View style={[styles.gridWrap, { paddingBottom: insets.bottom + (IS_VERY_TINY ? 10 : 18) }]}>
          <View style={[styles.grid, { gap: GAP }]}>
            {levels.map((lvl) => {
              const isOpen = lvl <= unlocked;
              const isDone = doneSet.has(lvl);

              const baseBg = isOpen ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
              const openBg = isDone ? 'rgba(120,255,140,0.22)' : 'rgba(80,255,190,0.12)';

              const border = !isOpen
                ? 'rgba(255, 189, 90, 0.94)'
                : isDone
                ? '#66FFB7'
                : '#53F7A7';

              const glow = isOpen ? (isDone ? styles.glowDone : styles.glowOpen) : null;

              return (
                <Pressable
                  key={lvl}
                  onPress={() => onOpenLevel(lvl)}
                  style={[
                    styles.cell,
                    glow,
                    {
                      width: SIZE,
                      height: SIZE,
                      opacity: isOpen ? 1 : 0.22,
                      backgroundColor: isOpen ? openBg : baseBg,
                      borderColor: border,
                      transform: [{ scale: isOpen ? 1 : 0.98 }],
                    },
                  ]}
                >
                  <Text style={[styles.cellText, { fontSize: IS_VERY_TINY ? 13 : 15, opacity: isOpen ? 1 : 0.45 }]}>
                    {lvl}
                  </Text>

                  {isDone && <Text style={styles.doneMark}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.hint}>
            Levels unlock in order. Complete Level {unlocked} to open the next one.
          </Text>
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.83)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: -1 },

  title: { color: '#8FE6FF', fontWeight: '900', fontSize: IS_VERY_TINY ? 16 : 18 },

  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(243, 189, 128, 0.86)',
  },
  counterIcon: { width: 16, height: 16 },
  counterText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  gridWrap: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: IS_VERY_TINY ? 10 : 16,
    alignItems: 'center',
  },

  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  cell: {
    borderRadius: 10,
    borderWidth: 2.6, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#476a0cff',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  glowOpen: {
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  glowDone: {
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10,
  },

  cellText: {
    color: '#9f5f16ff',
    fontWeight: '900',
  },

  doneMark: {
    position: 'absolute',
    right: 7,
    top: 3,
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.70)',
  },

  hint: {
    marginTop: IS_VERY_TINY ? 8 : 12,
    color: 'rgba(255,255,255,0.65)',
    fontSize: IS_VERY_TINY ? 11 : 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
