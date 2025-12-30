import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Stories'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 760;
const IS_TINY = H < 690;
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background.png');
const SPIKE_STAGE4 = require('../assets/spike_stage4.png');

type Story = { id: number; title: string; text: string };

const STORAGE_SAVED_STORIES = 'saved_stories_v1'; 

const STORIES: Story[] = [
  {
    id: 1,
    title: 'Story 1 — The First Spark',
    text:
      'I was very small when you found me.\n' +
      'Not lost — just quiet.\n' +
      'Every word you solve gives me a little warmth.\n' +
      'I don’t rush. I don’t ask for more.\n' +
      'I simply glow when you stay.',
  },
  {
    id: 2,
    title: 'Story 2 — Learning to Grow',
    text:
      'Growth is not about speed.\n' +
      'It is about returning.\n' +
      'Each time you come back, I feel steadier.\n' +
      'Not brighter — calmer.\n' +
      'That is how I learn to grow.',
  },
  {
    id: 3,
    title: 'Story 3 — The Rhythm We Found',
    text:
      'There is a rhythm between us now.\n' +
      'A pause. A word. A breath.\n' +
      'You move forward, and I follow.\n' +
      'Not because I must —\n' +
      'but because it feels right.',
  },
  {
    id: 4,
    title: 'Story 4 — Holding the Light',
    text:
      'Some days are quiet.\n' +
      'Those are my favorite.\n' +
      'You don’t push the light — you let it stay.\n' +
      'That is when I shine the longest.\n' +
      'Balance keeps me whole.',
  },
  {
    id: 5,
    title: 'Story 5 — Still Here',
    text:
      'I am not finished.\n' +
      'Neither are you.\n' +
      'But we are here — steady and calm.\n' +
      'No need to hurry.\n' +
      'The light remains.',
  },
  {
    id: 6,
    title: 'Story 6 — Quiet Strength',
    text:
      'Strength does not shout.\n' +
      'It waits.\n' +
      'I feel it when you choose patience.\n' +
      'That choice keeps me standing.\n' +
      'Soft, but unbroken.',
  },
  {
    id: 7,
    title: 'Story 7 — When Words Rest',
    text:
      'Not every moment needs solving.\n' +
      'Some need space.\n' +
      'I rest when you pause.\n' +
      'Silence feeds me too.\n' +
      'Just as much as effort.',
  },
  {
    id: 8,
    title: 'Story 8 — The Small Return',
    text:
      'You came back today.\n' +
      'Not for reward — just habit.\n' +
      'That matters more than progress.\n' +
      'That is how trust forms.\n' +
      'Quietly.',
  },
  {
    id: 9,
    title: 'Story 9 — Gentle Focus',
    text:
      'You did not rush the answer.\n' +
      'You stayed with it.\n' +
      'I felt that calm attention.\n' +
      'It keeps me clear.\n' +
      'It keeps me warm.',
  },
  {
    id: 10,
    title: 'Story 10 — Light Without Effort',
    text:
      'Some light comes naturally.\n' +
      'No pushing. No proving.\n' +
      'When you let go,\n' +
      'I shine on my own.\n' +
      'That is enough.',
  },
  {
    id: 11,
    title: 'Story 11 — Shared Stillness',
    text:
      'We are quieter now.\n' +
      'Not less alive — more present.\n' +
      'I like this pace.\n' +
      'It gives space to breathe.\n' +
      'Together.',
  },
  {
    id: 12,
    title: 'Story 12 — Steady Steps',
    text:
      'One word.\n' +
      'One breath.\n' +
      'One step forward.\n' +
      'That rhythm keeps me grounded.\n' +
      'I follow it gladly.',
  },
  {
    id: 13,
    title: 'Story 13 — Warm Habit',
    text:
      'You show up.\n' +
      'Again and again.\n' +
      'Not perfectly — honestly.\n' +
      'That warmth stays with me.\n' +
      'Long after.',
  },
  {
    id: 14,
    title: 'Story 14 — No Rush',
    text:
      'We are not late.\n' +
      'We are not behind.\n' +
      'Every moment arrives on time.\n' +
      'I glow best\n' +
      'when you trust that.',
  },
  {
    id: 15,
    title: 'Story 15 — The Light Continues',
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

export default function StoriesScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();

  const startIndex = (route as any)?.params?.startIndex;
  const initialIndex = Number.isFinite(startIndex)
    ? Math.max(0, Math.min(STORIES.length - 1, startIndex))
    : 0;

  const [idx, setIdx] = useState(initialIndex);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  const story = useMemo(() => STORIES[idx], [idx]);
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
  const isSaved = savedSet.has(story.id);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(0.985)).current;

  const animateIn = () => {
    fade.setValue(0);
    slide.setValue(10);
    scale.setValue(0.985);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadSaved = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_SAVED_STORIES);
      setSavedIds(safeParseNumberArray(raw));
    } catch {
      setSavedIds([]);
    }
  };

  const saveSaved = async (next: number[]) => {
    setSavedIds(next);
    try {
      await AsyncStorage.setItem(STORAGE_SAVED_STORIES, JSON.stringify(next));
    } catch {
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  useEffect(() => {
    animateIn();

  }, [idx]);

  const canPrev = idx > 0;
  const canNext = idx < STORIES.length - 1;

  const onPrev = () => {
    if (!canPrev) return;
    setIdx(v => Math.max(0, v - 1));
  };

  const onNext = () => {
    if (!canNext) return;
    setIdx(v => Math.min(STORIES.length - 1, v + 1));
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `${story.title}\n\n${story.text}` });
    } catch {
    }
  };

  const onToggleSave = async () => {
    const next = (() => {
      const set = new Set(savedIds);
      if (set.has(story.id)) set.delete(story.id);
      else set.add(story.id);
      const arr = Array.from(set);
      arr.sort((a, b) => a - b);
      return arr;
    })();
    await saveSaved(next);
  };

  const topPad = insets.top + (IS_VERY_TINY ? 6 : 10);
  const spikeW = Math.min(W * (IS_VERY_TINY ? 0.84 : 0.76), 380);
  const spikeH = IS_VERY_TINY ? 210 : IS_TINY ? 240 : IS_SMALL ? 275 : 315;
  const arrowTop = Math.round(topPad + (IS_VERY_TINY ? 14 : 18) + spikeH / 2 - 24);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.title}>Stories</Text>

        <View style={{ width: 34 }} />
      </View>

      <View style={styles.content}>
        <Pressable
          onPress={onPrev}
          disabled={!canPrev}
          style={[
            styles.arrowBtn,
            styles.arrowLeft,
            { top: arrowTop },
            !canPrev && styles.arrowDisabled,
          ]}
          hitSlop={12}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!canNext}
          style={[
            styles.arrowBtn,
            styles.arrowRight,
            { top: arrowTop },
            !canNext && styles.arrowDisabled,
          ]}
          hitSlop={12}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>

        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }, { scale }],
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Image source={SPIKE_STAGE4} style={{ width: spikeW, height: spikeH }} resizeMode="contain" />

          <View style={[styles.card, { marginTop: IS_VERY_TINY ? 8 : 12 }]}>
            <Text style={styles.storyTitle}>{story.title}</Text>
            <Text style={styles.storyBody}>{story.text}</Text>

            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn} onPress={onShare}>
                <Text style={styles.actionBtnText}>Share</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, isSaved && styles.actionBtnSaved]}
                onPress={onToggleSave}
              >
                <Text style={[styles.actionBtnText, isSaved && styles.actionBtnTextSaved]}>
                  {isSaved ? 'Saved' : 'Favorite'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
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

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: IS_VERY_TINY ? 8 : 12,
  },

  arrowBtn: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderWidth: 2,
    borderColor: 'rgba(244,182,58,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  arrowLeft: { left: 10 },
  arrowRight: { right: 10 },
  arrowDisabled: { opacity: 0.25 },
  arrowText: {
    color: '#8FE6FF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: -2,
  },

  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: IS_VERY_TINY ? 14 : 16,
    paddingVertical: IS_VERY_TINY ? 14 : 16,
  },

  storyTitle: {
    textAlign: 'center',
    color: '#8FE6FF',
    fontWeight: '900',
    fontSize: IS_VERY_TINY ? 14 : IS_TINY ? 15 : 16,
    marginBottom: 10,
    lineHeight: IS_VERY_TINY ? 18 : 20,
  },

  storyBody: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: IS_VERY_TINY ? 13 : IS_TINY ? 14 : 15,
    lineHeight: IS_VERY_TINY ? 18 : IS_TINY ? 20 : 22,
  },

  actionRow: {
    marginTop: IS_VERY_TINY ? 12 : 14,
    flexDirection: 'row',
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    height: IS_VERY_TINY ? 38 : 42,
    borderRadius: 12,
    backgroundColor: 'rgba(120,184,255,0.24)',
    borderWidth: 2,
    borderColor: '#F4B63A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#8FE6FF',
    fontWeight: '900',
    fontSize: IS_VERY_TINY ? 12 : 13,
  },

  actionBtnSaved: { backgroundColor: '#F4B63A' },
  actionBtnTextSaved: { color: '#2A1906' },
});
