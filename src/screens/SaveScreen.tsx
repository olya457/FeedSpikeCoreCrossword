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
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background.png');
const SPIKE_STAGE4 = require('../assets/spike_stage4.png');

const STORAGE_SAVED_STORIES = 'saved_stories_v1';
const STORAGE_FRUITS = 'spike_fruits_v1';

type Story = { id: number; titleShort: string; titleFull: string; text: string };

const STORIES: Story[] = [
  { id: 1, titleShort: 'The First Spark', titleFull: 'Story 1 — The First Spark', text: 'I was very small when you found me.\nNot lost — just quiet.\nEvery word you solve gives me a little warmth.\nI don’t rush. I don’t ask for more.\nI simply glow when you stay.' },
  { id: 2, titleShort: 'Learning to Grow', titleFull: 'Story 2 — Learning to Grow', text: 'Growth is not about speed.\nIt is about returning.\nEach time you come back, I feel steadier.\nNot brighter — calmer.\nThat is how I learn to grow.' },
  { id: 3, titleShort: 'The Rhythm We Found', titleFull: 'Story 3 — The Rhythm We Found', text: 'There is a rhythm between us now.\nA pause. A word. A breath.\nYou move forward, and I follow.\nNot because I must —\nbut because it feels right.' },
  { id: 4, titleShort: 'Holding the Light', titleFull: 'Story 4 — Holding the Light', text: 'Some days are quiet.\nThose are my favorite.\nYou don’t push the light — you let it stay.\nThat is when I shine the longest.\nBalance keeps me whole.' },
  { id: 5, titleShort: 'Still Here', titleFull: 'Story 5 — Still Here', text: 'I am not finished.\nNeither are you.\nBut we are here — steady and calm.\nNo need to hurry.\nThe light remains.' },
  { id: 6, titleShort: 'Quiet Strength', titleFull: 'Story 6 — Quiet Strength', text: 'Strength does not shout.\nIt waits.\nI feel it when you choose patience.\nThat choice keeps me standing.\nSoft, but unbroken.' },
  { id: 7, titleShort: 'When Words Rest', titleFull: 'Story 7 — When Words Rest', text: 'Not every moment needs solving.\nSome need space.\nI rest when you pause.\nSilence feeds me too.\nJust as much as effort.' },
  { id: 8, titleShort: 'The Small Return', titleFull: 'Story 8 — The Small Return', text: 'You came back today.\nNot for reward — just habit.\nThat matters more than progress.\nThat is how trust forms.\nQuietly.' },
  { id: 9, titleShort: 'Gentle Focus', titleFull: 'Story 9 — Gentle Focus', text: 'You did not rush the answer.\nYou stayed with it.\nI felt that calm attention.\nIt keeps me clear.\nIt keeps me warm.' },
  { id: 10, titleShort: 'Light Without Effort', titleFull: 'Story 10 — Light Without Effort', text: 'Some light comes naturally.\nNo pushing. No proving.\nWhen you let go,\nI shine on my own.\nThat is enough.' },
  { id: 11, titleShort: 'Shared Stillness', titleFull: 'Story 11 — Shared Stillness', text: 'We are quieter now.\nNot less alive — more present.\nI like this pace.\nIt gives space to breathe.\nTogether.' },
  { id: 12, titleShort: 'Steady Steps', titleFull: 'Story 12 — Steady Steps', text: 'One word.\nOne breath.\nOne step forward.\nThat rhythm keeps me grounded.\nI follow it gladly.' },
  { id: 13, titleShort: 'Warm Habit', titleFull: 'Story 13 — Warm Habit', text: 'You show up.\nAgain and again.\nNot perfectly — honestly.\nThat warmth stays with me.\nLong after.' },
  { id: 14, titleShort: 'No Rush', titleFull: 'Story 14 — No Rush', text: 'We are not late.\nWe are not behind.\nEvery moment arrives on time.\nI glow best\nwhen you trust that.' },
  { id: 15, titleShort: 'The Light Continues', titleFull: 'Story 15 — The Light Continues', text: 'This is not an ending.\nJust a calm point.\nI am still here.\nAnd when you return,\nthe light will be waiting.' },
];

function safeParseNumberArray(raw: string | null): number[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    return Array.from(new Set(v.map(Number).filter(n => Number.isFinite(n))));
  } catch { return []; }
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
      setFruits(rawFruits ? Number(rawFruits) : 0);
    } catch { }
  };

  useEffect(() => {
    load();
    animateIn();
    return navigation.addListener('focus', () => { load(); animateIn(); });
  }, [navigation]);

  const savedList = useMemo(() => {
    const set = new Set(savedIds);
    return STORIES.filter(s => set.has(s.id));
  }, [savedIds]);

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 48;
  const androidExtraSpacer = Platform.OS === 'android' ? 10 : 0;
  
  const bottomPad = (IS_VERY_TINY ? 16 : 22) + (Platform.OS === 'android' ? 8 : 18);
  const CARD_W = Math.min(W - 36, 420);
  const ART_W = Math.min(CARD_W * 0.55, 240);
  const ART_H = Math.round(ART_W * 0.78);

  const onShareStory = async (s: Story) => {
    try { await Share.share({ message: `${s.titleFull}\n\n${s.text}` }); } catch { }
  };

  const onRemoveStory = async (id: number) => {
    const next = savedIds.filter(x => x !== id);
    setSavedIds(next);
    await AsyncStorage.setItem(STORAGE_SAVED_STORIES, JSON.stringify(next));
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={{ flex: 1 }}>
    
        <View style={[styles.header, { paddingTop: topPad }]}>
          <View style={styles.headerInner}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={15}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.title}>Saved</Text>
            <View style={styles.fruitsPill}>
              <Text style={styles.fruitsEmoji}>🍇</Text>
              <Text style={styles.fruitsText}>{fruits}</Text>
            </View>
          </View>
          <View style={{ height: 10 + androidExtraSpacer }} />
        </View>

        <Animated.View
          style={{
            flex: 1,
            opacity: a,
            transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }],
          }}
        >
          {savedList.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>You don’t have any saved stories yet</Text>
              <Pressable style={styles.goBtn} onPress={() => navigation.navigate('Stories' as any, { startIndex: 0 })}>
                <Text style={styles.goBtnText}>Go to Stories</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={savedList}
              keyExtractor={(x) => String(x.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: 8,
                paddingBottom: bottomPad + 40,
                paddingHorizontal: 18,
                gap: 16,
              }}
              renderItem={({ item }) => (
                <View style={{ alignItems: 'center' }}>
                  <View style={[styles.bigCard, { width: CARD_W }]}>
                    <Pressable onPress={() => navigation.navigate('Stories' as any, { startIndex: item.id - 1 })} style={{ alignItems: 'center', width: '100%' }}>
                      <Image source={SPIKE_STAGE4} style={{ width: ART_W, height: ART_H }} resizeMode="contain" />
                      <Text style={styles.cardTitle}>{item.titleShort}</Text>
                      <View style={styles.textPanel}>
                        <Text style={styles.cardBody} numberOfLines={5}>{item.text}</Text>
                      </View>
                    </Pressable>
                    <View style={styles.iconRow}>
                      <Pressable style={styles.iconBtn} onPress={() => onShareStory(item)}><Text style={styles.iconGlyph}>↗</Text></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => onRemoveStory(item.id)}><Text style={styles.iconGlyph}>✕</Text></Pressable>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { width: '100%', zIndex: 100 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 44 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: -2 },
  title: { color: '#8FE6FF', fontWeight: '900', fontSize: IS_VERY_TINY ? 16 : 18 },
  fruitsPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 2, borderColor: '#F4B63A' },
  fruitsEmoji: { fontSize: 14 },
  fruitsText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 18 },
  emptyText: { color: 'rgba(255,255,255,0.55)', fontWeight: '800', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  goBtn: { height: 38, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#F4B63A', alignItems: 'center', justifyContent: 'center' },
  goBtnText: { color: '#2A1906', fontWeight: '900', fontSize: 13 },
  bigCard: { borderRadius: 18, backgroundColor: 'rgba(56, 66, 120, 0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16, alignItems: 'center' },
  cardTitle: { marginTop: 8, color: '#FFFFFF', fontWeight: '900', fontSize: 17, textAlign: 'center' },
  textPanel: { width: '100%', marginTop: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 12, paddingVertical: 10 },
  cardBody: { color: 'rgba(255,255,255,0.92)', fontWeight: '800', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  iconRow: { marginTop: 12, flexDirection: 'row', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(120,184,255,0.2)', borderWidth: 2, borderColor: '#F4B63A', alignItems: 'center', justifyContent: 'center' },
  iconGlyph: { color: '#8FE6FF', fontWeight: '900', fontSize: 20 },
});