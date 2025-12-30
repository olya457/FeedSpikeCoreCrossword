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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 750;
const IS_TINY = H < 690;
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background2.png');

const ONB1 = require('../assets/onboard1.png');
const ONB2 = require('../assets/onboard2.png');
const ONB3 = require('../assets/onboard3.png');
const ONB4 = require('../assets/onboard4.png');

type Page = {
  key: string;
  title: string;
  text: string;
  image: any;
  button: string;
};

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const pages: Page[] = useMemo(
    () => [
      {
        key: 'p1',
        title: 'Meet Spike',
        text:
          'Spike is a tiny core of energy.\nSolve crosswords\nto collect fruits and help Spike grow.',
        image: ONB1,
        button: 'Next',
      },
      {
        key: 'p2',
        title: 'Solve & Collect',
        text:
          'Each crossword gives you a fruit.\nNo rush. No pressure. Just focus and words.',
        image: ONB2,
        button: 'Next',
      },
      {
        key: 'p3',
        title: 'Feed the Core',
        text:
          'Feed Spike with collected fruits.\nEvery meal makes Spike stronger\nand brighter.',
        image: ONB3,
        button: 'Next',
      },
      {
        key: 'p4',
        title: 'Grow Together',
        text:
          'One level — one reward.\nWatch Spike evolve as you move forward.',
        image: ONB4,
        button: 'Start Growing',
      },
    ],
    []
  );

  const page = pages[index];

  const a = useRef({
    wrap: new Animated.Value(0),
    img: new Animated.Value(0),
    title: new Animated.Value(0),
    note: new Animated.Value(0),
    btn: new Animated.Value(0),
  }).current;

  const playIn = () => {
    a.wrap.setValue(0);
    a.img.setValue(0);
    a.title.setValue(0);
    a.note.setValue(0);
    a.btn.setValue(0);

    Animated.sequence([
      Animated.timing(a.wrap, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.stagger(90, [
        Animated.spring(a.img, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
        Animated.timing(a.title, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(a.note, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(a.btn, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
      ]),
    ]).start();
  };

  useEffect(() => {
    playIn();
  }, [index]);

  const onSkip = () => navigation.replace('Menu');

  const onNext = () => {
    if (index < pages.length - 1) setIndex((v) => v + 1);
    else navigation.replace('Menu');
  };

  const HERO_H = IS_VERY_TINY ? 300 : IS_TINY ? 330 : IS_SMALL ? 360 : 410;
  const HERO_W = Math.min(W - 44, IS_VERY_TINY ? 330 : 393);

  const TITLE_SIZE = IS_VERY_TINY ? 18 : IS_TINY ? 20 : 22;
  const NOTE_TEXT_SIZE = IS_VERY_TINY ? 11 : 12;
  const NOTE_LINE = IS_VERY_TINY ? 14 : 16;

  const NOTE_PAD_V = IS_VERY_TINY ? 8 : 10;
  const NOTE_PAD_H = IS_VERY_TINY ? 12 : 14;

  const BTN_W = IS_VERY_TINY ? 126 : 132;
  const BTN_H = IS_VERY_TINY ? 34 : 36;

  const TOP_OFFSET = insets.top + 30; 

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: TOP_OFFSET,
            opacity: a.wrap,
            transform: [
              {
                translateY: a.wrap.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onSkip} style={styles.skipBtn} hitSlop={10}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.heroWrap,
            { height: HERO_H },
            {
              opacity: a.img,
              transform: [
                {
                  translateY: a.img.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
                {
                  scale: a.img.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Image source={page.image} style={{ width: HERO_W, height: '100%' }} resizeMode="contain" />
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              fontSize: TITLE_SIZE,
              opacity: a.title,
              transform: [
                {
                  translateY: a.title.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {page.title}
        </Animated.Text>

        <Animated.View
          style={[
            styles.note,
            {
              paddingHorizontal: NOTE_PAD_H,
              paddingVertical: NOTE_PAD_V,
              opacity: a.note,
              transform: [
                {
                  translateY: a.note.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.noteText, { fontSize: NOTE_TEXT_SIZE, lineHeight: NOTE_LINE }]}>
            {page.text}
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: a.btn,
            transform: [
              {
                translateY: a.btn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
              {
                scale: a.btn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1],
                }),
              },
            ],
          }}
        >
          <Pressable style={[styles.nextBtn, { width: BTN_W, height: BTN_H }]} onPress={onNext}>
            <Text style={styles.nextText}>{page.button}</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: IS_VERY_TINY ? 18 : IS_SMALL ? 22 : 30 }} />
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  content: {
    flex: 1,
    paddingHorizontal: 22,
  },

  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  skipBtn: {
    backgroundColor: '#F4B63A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: '#1A1206',
    fontWeight: '900',
    fontSize: 11,
  },

  heroWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  title: {
    marginTop: 8,
    color: '#6FE6FF',
    fontWeight: '900',
    textAlign: 'center',
  },

  note: {
    marginTop: 12,
    width: '92%',
    alignSelf: 'center',
    backgroundColor: '#F4B63A',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  noteText: {
    color: '#2A1906',
    fontWeight: '800',
    textAlign: 'center',
  },

  nextBtn: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: '#F4B63A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  nextText: {
    color: '#2A1906',
    fontWeight: '900',
    fontSize: 13,
  },
});
