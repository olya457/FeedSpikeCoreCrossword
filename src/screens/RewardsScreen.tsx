import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Rewards'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 760;
const IS_TINY = H < 690;
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background.png');

const CUPS = [
  { title: 'First Light Cup', img: require('../assets/cup_1.png') },
  { title: 'Spark Crest Cup', img: require('../assets/cup_2.png') },
  { title: 'Dawn Flame Cup', img: require('../assets/cup_3.png') },
  { title: 'Sky Pulse Cup', img: require('../assets/cup_4.png') },
  { title: 'Glow Crown Cup', img: require('../assets/cup_5.png') },
  { title: 'Aurora Cup', img: require('../assets/cup_6.png') },
];

const TOTAL = 50;
const STORAGE_DONE_LEVELS = 'crossword_done_levels_v1';
const STORAGE_FRUITS = 'spike_fruits_v1';

const COLS = 3;
const CONTENT_OFFSET_Y = 20;

function safeParseNumberArray(raw: string | null): number[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    const arr = v
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= TOTAL);
    const uniq = Array.from(new Set(arr));
    uniq.sort((a, b) => a - b);
    return uniq;
  } catch {
    return [];
  }
}

export default function RewardsScreen({ navigation }: Props) {
  const [done, setDone] = useState<number[]>([]);
  const [fruits, setFruits] = useState(0);
  const [page, setPage] = useState(0);

  const a = useRef(new Animated.Value(0)).current;

  const doneSet = useMemo(() => new Set(done), [done]);
  const levels = useMemo(() => Array.from({ length: TOTAL }, (_, i) => i + 1), []);

  const PER_PAGE = IS_VERY_TINY ? 9 : IS_TINY ? 12 : 15;
  const pagesCount = Math.max(1, Math.ceil(levels.length / PER_PAGE));

  const pageData = useMemo(() => {
    const start = page * PER_PAGE;
    return levels.slice(start, start + PER_PAGE);
  }, [levels, page, PER_PAGE]);

  const topPad =
    (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + (IS_VERY_TINY ? 8 : 12);

  const GAP = IS_VERY_TINY ? 10 : IS_TINY ? 12 : 14;
  const PAD = 18;

  const cardW = Math.floor((W - PAD * 2 - GAP * (COLS - 1)) / COLS);
  const CARD_W = Math.max(IS_VERY_TINY ? 94 : 98, Math.min(cardW, IS_SMALL ? 118 : 130));
  const CARD_H = Math.round(CARD_W * (IS_VERY_TINY ? 1.18 : 1.15));

  const animateIn = () => {
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  };

  const loadProgress = async () => {
    try {
      const [[, rawDone], [, rawFruits]] = await AsyncStorage.multiGet([
        STORAGE_DONE_LEVELS,
        STORAGE_FRUITS,
      ]);

      const doneArr = safeParseNumberArray(rawDone);
      const fixedFruits = doneArr.length;

      setDone(doneArr);
      setFruits(fixedFruits);

      const fruitsFromStorage = rawFruits ? Number(rawFruits) : fixedFruits;
      if (Number.isFinite(fruitsFromStorage) && fruitsFromStorage !== fixedFruits) {
        await AsyncStorage.setItem(STORAGE_FRUITS, String(fixedFruits));
      }
    } catch {}
  };

  useEffect(() => {
    loadProgress();
    animateIn();

    const unsub = navigation.addListener('focus', () => {
      loadProgress();
      animateIn();
    });

    return unsub;
  }, [navigation]);

  useEffect(() => {
    if (page > pagesCount - 1) setPage(pagesCount - 1);
  }, [pagesCount, page]);

  const renderItem = ({ item: lvl }: { item: number }) => {
    const unlocked = doneSet.has(lvl);

    if (!unlocked) {
      return (
        <View style={[styles.tileLocked, { width: CARD_W, height: CARD_H, marginBottom: GAP }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{lvl}</Text>
          </View>
          <View style={styles.lockBox}>
            <Text style={styles.lockEmoji}>🔒</Text>
          </View>
          <Text style={styles.lockLabel}>Locked</Text>
        </View>
      );
    }

    const cup = CUPS[(lvl - 1) % 6];

    return (
      <View style={[styles.tileUnlocked, { width: CARD_W, height: CARD_H, marginBottom: GAP }]}>
        <View style={[styles.badge, styles.badgeUnlocked]}>
          <Text style={[styles.badgeText, styles.badgeTextUnlocked]}>{lvl}</Text>
        </View>
        <Image source={cup.img} style={styles.cupImg} resizeMode="contain" />
      </View>
    );
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.topTitleRow, { paddingTop: topPad }]}>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={[styles.backBtn, { position: 'absolute', left: 18, top: topPad }]} 
          hitSlop={10}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        
        <Text style={styles.title}>Rewards</Text>
      </View>

      <Animated.View
        style={{
          flex: 1,
          transform: [
            {
              translateY: a.interpolate({
                inputRange: [0, 1],
                outputRange: [CONTENT_OFFSET_Y + 10, CONTENT_OFFSET_Y],
              }),
            },
          ],
          opacity: a,
        }}
      >
        <View style={[styles.pagerBar, { paddingHorizontal: PAD }]}>
          <Pressable
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            style={[styles.pagerBtn, page === 0 && styles.pagerBtnDisabled]}
            disabled={page === 0}
          >
            <Text style={styles.pagerBtnText}>Prev</Text>
          </Pressable>

          <Text style={styles.pageText}>
            {page + 1}/{pagesCount}
          </Text>

          <View style={styles.rightRow}>
            <Pressable
              onPress={() => setPage((p) => Math.min(pagesCount - 1, p + 1))}
              style={[styles.pagerBtn, page >= pagesCount - 1 && styles.pagerBtnDisabled]}
              disabled={page >= pagesCount - 1}
            >
              <Text style={styles.pagerBtnText}>Next</Text>
            </Pressable>

            <View style={styles.counterPill}>
              <Text style={styles.counterEmoji}>🍇</Text>
              <Text style={styles.counterText}>{fruits}</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={pageData}
          keyExtractor={(x) => String(x)}
          numColumns={COLS}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: PAD,
            paddingTop: IS_VERY_TINY ? 10 : 12,
            paddingBottom: 28,
          }}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            gap: GAP,
          }}
          showsVerticalScrollIndicator={false}
        />

        <Text style={[styles.hint, { marginTop: -6 }]} />
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  topTitleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    minHeight: 44,
  },

  title: { color: '#8FE6FF', fontWeight: '900', fontSize: IS_VERY_TINY ? 16 : 18 },

  pagerBar: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backText: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: -1 },

  pagerBtn: {
    height: 34,
    minWidth: 64,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(120,184,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(143,230,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerBtnDisabled: { opacity: 0.35 },
  pagerBtnText: { color: '#8FE6FF', fontWeight: '900', fontSize: 13 },

  pageText: { color: 'rgba(255,255,255,0.75)', fontWeight: '900', fontSize: 13, minWidth: 40, textAlign: 'center' },

  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  counterEmoji: { fontSize: 14 },
  counterText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  tileLocked: {
    borderRadius: 18,
    backgroundColor: '#78B8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  tileUnlocked: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(143,230,255,0.75)',
  },

  badge: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUnlocked: {
    backgroundColor: 'rgba(143,230,255,0.20)',
    borderColor: 'rgba(143,230,255,0.75)',
  },
  badgeText: { color: 'rgba(0,0,0,0.75)', fontWeight: '900', fontSize: 13 },
  badgeTextUnlocked: { color: '#8FE6FF' },

  lockBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: { fontSize: 22 },
  lockLabel: {
    marginTop: 10,
    color: '#D9F0FF',
    fontWeight: '900',
    fontSize: 13,
  },

  cupImg: { width: 92, height: 92, marginTop: 8 },

  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
});