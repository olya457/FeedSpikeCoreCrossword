import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Save'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 690;
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background.png');
const SPIKE_STAGE4 = require('../assets/spike_stage4.png');

const STORAGE_SAVED_STORIES = 'saved_stories_v1';
const STORAGE_FRUITS = 'spike_fruits_v1';
const CONTENT_OFFSET_Y = 60;

type Story = { id: number; titleShort: string; titleFull: string; text: string };

const STORIES: Story[] = [
  {
    id: 1,
    titleShort: 'The First Spark',
    titleFull: 'Story 1 — The First Spark',
    text:
      'I was very small when you found me.\n' +
      'Not lost — just quiet.\n' +
      'Every word you solve gives me a little warmth.\n' +
      'I don’t rush. I don’t ask for more.\n' +
      'I simply glow when you stay.',
  },
  {
    id: 2,
    titleShort: 'Learning to Grow',
    titleFull: 'Story 2 — Learning to Grow',
    text:
      'Growth is not about speed.\n' +
      'It is about returning.\n' +
      'Each time you come back, I feel steadier.\n' +
      'Not brighter — calmer.\n' +
      'That is how I learn to grow.',
  },
  {
    id: 3,
    titleShort: 'The Rhythm We Found',
    titleFull: 'Story 3 — The Rhythm We Found',
    text:
      'There is a rhythm between us now.\n' +
      'A pause. A word. A breath.\n' +
      'You move forward, and I follow.\n' +
      'Not because I must —\n' +
      'but because it feels right.',
  },
  {
    id: 4,
    titleShort: 'Holding the Light',
    titleFull: 'Story 4 — Holding the Light',
    text:
      'Some days are quiet.\n' +
      'Those are my favorite.\n' +
      'You don’t push the light — you let it stay.\n' +
      'That is when I shine the longest.\n' +
      'Balance keeps me whole.',
  },
  {
    id: 5,
    titleShort: 'Still Here',
    titleFull: 'Story 5 — Still Here',
    text:
      'I am not finished.\n' +
      'Neither are you.\n' +
      'But we are here — steady and calm.\n' +
      'No need to hurry.\n' +
      'The light remains.',
  },
  {
    id: 6,
    titleShort: 'Quiet Strength',
    titleFull: 'Story 6 — Quiet Strength',
    text:
      'Strength does not shout.\n' +
      'It waits.\n' +
      'I feel it when you choose patience.\n' +
      'That choice keeps me standing.\n' +
      'Soft, but unbroken.',
  },
  {
    id: 7,
    titleShort: 'When Words Rest',
    titleFull: 'Story 7 — When Words Rest',
    text:
      'Not every moment needs solving.\n' +
      'Some need space.\n' +
      'I rest when you pause.\n' +
      'Silence feeds me too.\n' +
      'Just as much as effort.',
  },
  {
    id: 8,
    titleShort: 'The Small Return',
    titleFull: 'Story 8 — The Small Return',
    text:
      'You came back today.\n' +
      'Not for reward — just habit.\n' +
      'That matters more than progress.\n' +
      'That is how trust forms.\n' +
      'Quietly.',
  },
  {
    id: 9,
    titleShort: 'Gentle Focus',
    titleFull: 'Story 9 — Gentle Focus',
    text:
      'You did not rush the answer.\n' +
      'You stayed with it.\n' +
      'I felt that calm attention.\n' +
      'It keeps me clear.\n' +
      'It keeps me warm.',
  },
  {
    id: 10,
    titleShort: 'Light Without Effort',
    titleFull: 'Story 10 — Light Without Effort',
    text:
      'Some light comes naturally.\n' +
      'No pushing. No proving.\n' +
      'When you let go,\n' +
      'I shine on my own.\n' +
      'That is enough.',
  },
  {
    id: 11,
    titleShort: 'Shared Stillness',
    titleFull: 'Story 11 — Shared Stillness',
    text:
      'We are quieter now.\n' +
      'Not less alive — more present.\n' +
      'I like this pace.\n' +
      'It gives space to breathe.\n' +
      'Together.',
  },
  {
    id: 12,
    titleShort: 'Steady Steps',
    titleFull: 'Story 12 — Steady Steps',
    text:
      'One word.\n' +
      'One breath.\n' +
      'One step forward.\n' +
      'That rhythm keeps me grounded.\n' +
      'I follow it gladly.',
  },
  {
    id: 13,
    titleShort: 'Warm Habit',
    titleFull: 'Story 13 — Warm Habit',
    text:
      'You show up.\n' +
      'Again and again.\n' +
      'Not perfectly — honestly.\n' +
      'That warmth stays with me.\n' +
      'Long after.',
  },
  {
    id: 14,
    titleShort: 'No Rush',
    titleFull: 'Story 14 — No Rush',
    text:
      'We are not late.\n' +
      'We are not behind.\n' +
      'Every moment arrives on time.\n' +
      'I glow best\n' +
      'when you trust that.',
  },
  {
    id: 15,
    titleShort: 'The Light Continues',
    titleFull: 'Story 15 — The Light Continues',
    text:
      'This is not an ending.\n' +
      'Just a calm point.\n' +
      'I am still here.\n' +
      'And when you return,\n' +
      'the light will be waiting.',
  },
];

function safeParseNumberArray(raw: string | null): number[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    return Array.from(new Set(v.map(Number).filter(n => Number.isFinite(n))));
  } catch {
    return [];
  }
}

export default function SaveScreen({ navigation }: Props) {
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [fruits, setFruits] = useState(0);

  const a = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    a.setValue(0);
    Animated.timing(a, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const load = async () => {
    try {
      const [rawSaved, rawFruits] = await Promise.all([
        AsyncStorage.getItem(STORAGE_SAVED_STORIES),
        AsyncStorage.getItem(STORAGE_FRUITS),
      ]);

      setSavedIds(safeParseNumberArray(rawSaved));

      const f = rawFruits ? Number(rawFruits) : 0;
      setFruits(Number.isFinite(f) ? f : 0);
    } catch {
      setSavedIds([]);
      setFruits(0);
    }
  };

  useEffect(() => {
    load();
    animateIn();

    const unsub = navigation.addListener('focus', () => {
      load();
      animateIn();
    });
    return unsub;
  }, [navigation]);

  const savedList = useMemo(() => {
    const set = new Set(savedIds);
    return STORIES.filter(s => set.has(s.id));
  }, [savedIds]);

  const topPad =
    (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + (IS_VERY_TINY ? 8 : 12);

  const bottomPad = (IS_VERY_TINY ? 16 : 22) + (Platform.OS === 'android' ? 8 : 18);

  const CARD_W = Math.min(W - 36, 420);
  const ART_W = Math.min(CARD_W * 0.55, 240);
  const ART_H = Math.round(ART_W * 0.78);

  const onGoToStories = () => {
    navigation.navigate('Stories' as any, { startIndex: 0 });
  };

  const onOpenStory = (id: number) => {
    navigation.navigate('Stories' as any, { startIndex: id - 1 });
  };

  const onShareStory = async (story: Story) => {
    try {
      await Share.share({ message: `${story.titleFull}\n\n${story.text}` });
    } catch {
    }
  };

  const onRemoveStory = async (id: number) => {
    const next = savedIds.filter(x => x !== id);
    setSavedIds(next);
    try {
      await AsyncStorage.setItem(STORAGE_SAVED_STORIES, JSON.stringify(next));
    } catch {
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <Animated.View
        style={{
          flex: 1,
          paddingTop: CONTENT_OFFSET_Y,
          opacity: a,
          transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <View style={[styles.header, { paddingTop: topPad }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.title}>Saved</Text>

          <View style={styles.fruitsPill}>
            <Text style={styles.fruitsEmoji}>🍇</Text>
            <Text style={styles.fruitsText}>{fruits}</Text>
          </View>
        </View>

        {savedList.length === 0 ? (
          <View style={[styles.empty, { paddingBottom: bottomPad }]}>
            <Text style={styles.emptyText}>You don’t have any saved stories yet</Text>

            <Pressable style={styles.goBtn} onPress={onGoToStories}>
              <Text style={styles.goBtnText}>Go to Stories</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={savedList}
            keyExtractor={(x) => String(x.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 14,
              paddingBottom: bottomPad,
              paddingHorizontal: 18,
              gap: 16,
            }}
            renderItem={({ item }) => (
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.bigCard, { width: CARD_W }]}>
                  <Pressable onPress={() => onOpenStory(item.id)} style={{ alignItems: 'center' }}>
                    <Image
                      source={SPIKE_STAGE4}
                      style={{ width: ART_W, height: ART_H }}
                      resizeMode="contain"
                    />
                    <Text style={styles.cardTitle}>{item.titleShort}</Text>

                    <View style={styles.textPanel}>
                      <Text style={styles.cardBody} numberOfLines={5}>
                        {item.text}
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.iconRow}>
                    <Pressable style={styles.iconBtn} onPress={() => onShareStory(item)}>
                      <Text style={styles.iconGlyph}>↗</Text>
                    </Pressable>

                    <Pressable style={styles.iconBtn} onPress={() => onRemoveStory(item.id)}>
                      <Text style={styles.iconGlyph}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />
        )}
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
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: -1 },

  title: { color: '#8FE6FF', fontWeight: '900', fontSize: IS_VERY_TINY ? 16 : 18 },

  fruitsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 2,
    borderColor: '#F4B63A',
  },
  fruitsEmoji: { fontSize: 14 },
  fruitsText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 18,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '800',
    fontSize: IS_VERY_TINY ? 12 : 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  goBtn: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F4B63A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  goBtnText: { color: '#2A1906', fontWeight: '900', fontSize: 13 },

  bigCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(56, 66, 120, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  cardTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: IS_VERY_TINY ? 16 : 17,
    textAlign: 'center',
  },

  textPanel: {
    width: '100%',
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  cardBody: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    fontSize: IS_VERY_TINY ? 11 : 12,
    lineHeight: IS_VERY_TINY ? 15 : 16,
    textAlign: 'center',
  },

  iconRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(120,184,255,0.24)',
    borderWidth: 2,
    borderColor: '#F4B63A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    color: '#8FE6FF',
    fontWeight: '900',
    fontSize: 18,
    marginTop: -1,
  },
});
