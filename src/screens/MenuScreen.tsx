import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 750;
const IS_TINY = H < 690;
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background.png');
const COIN = require('../assets/coin.png');
const SPIKES = [
  require('../assets/spike_stage0.png'),
  require('../assets/spike_stage1.png'),
  require('../assets/spike_stage2.png'),
  require('../assets/spike_stage3.png'),
];

const STORAGE_FRUITS = 'spike_fruits_v1';
const STORAGE_STAGE = 'spike_stage_v1';

function MenuButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuBtn} onPress={onPress}>
      <Text style={styles.menuBtnText}>{title}</Text>
    </Pressable>
  );
}

async function loadNumber(key: string, fallback = 0) {
  try {
    const v = await AsyncStorage.getItem(key);
    const n = v ? Number(v) : fallback;
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

async function saveNumber(key: string, value: number) {
  try {
    await AsyncStorage.setItem(key, String(value));
  } catch {}
}

export default function MenuScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [fruits, setFruits] = useState<number>(0);
  const [stage, setStage] = useState<number>(0);
  const [modal, setModal] = useState<null | 'need' | 'confirm'>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const f = await loadNumber(STORAGE_FRUITS, 0);
      const s = await loadNumber(STORAGE_STAGE, 0);
      if (!alive) return;
      setFruits(f);
      setStage(Math.max(0, Math.min(s, SPIKES.length - 1)));
    };
    run();
    return () => {
      alive = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      const run = async () => {
        const f = await loadNumber(STORAGE_FRUITS, 0);
        const s = await loadNumber(STORAGE_STAGE, 0);
        if (!alive) return;
        setFruits(f);
        setStage(Math.max(0, Math.min(s, SPIKES.length - 1)));
      };
      run();
      return () => {
        alive = false;
      };
    }, []),
  );

  const spikeImg = useMemo(() => {
    const idx = Math.max(0, Math.min(stage, SPIKES.length - 1));
    return SPIKES[idx];
  }, [stage]);

  const onFeedPress = () => {
    if (fruits < 2) setModal('need');
    else setModal('confirm');
  };

  const doFeed = async () => {
    setModal(null);

    if (stage >= SPIKES.length - 1) return;

    const nextFruits = Math.max(0, fruits - 2);
    const nextStage = Math.min(stage + 1, SPIKES.length - 1);

    setFruits(nextFruits);
    setStage(nextStage);

    await AsyncStorage.multiSet([
      [STORAGE_FRUITS, String(nextFruits)],
      [STORAGE_STAGE, String(nextStage)],
    ]);
  };

  const onSpikeLongPress = async () => {
    const next = fruits + 1;
    setFruits(next);
    await saveNumber(STORAGE_FRUITS, next);
  };

  const topPad = insets.top + (IS_VERY_TINY ? 6 : 10);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={styles.headerTitle}>Spike</Text>

        <View style={styles.counterPill}>
          <Image source={COIN} style={styles.counterIcon} resizeMode="contain" />
          <Text style={styles.counterText}>{fruits}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Pressable onLongPress={onSpikeLongPress} style={styles.spikeWrap}>
          <Image source={spikeImg} style={styles.spikeImg} resizeMode="contain" />
        </Pressable>

        <Pressable style={styles.feedBtn} onPress={onFeedPress}>
          <Text style={styles.feedText}>Feed (2)</Text>
        </Pressable>
        <View style={styles.menuList}>
          <MenuButton title="Crossword Gameplay" onPress={() => navigation.navigate('Levels')} />
          <MenuButton title="Rewards" onPress={() => navigation.navigate('Rewards')} />
          <MenuButton title="Stories" onPress={() => navigation.navigate('Stories')} />
          <MenuButton title="Save" onPress={() => navigation.navigate('Save')} />
        </View>
      </View>
      <Modal
        visible={modal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModal(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModal(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalTopRow}>
              <View style={{ width: 18 }} />
              <View style={{ flex: 1 }} />
              <Pressable hitSlop={10} onPress={() => setModal(null)} style={styles.modalX}>
                <Text style={styles.modalXText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.modalText}>
              {modal === 'need'
                ? 'You need\n2 fruits to feed Spike'
                : stage >= SPIKES.length - 1
                ? 'Spike is already\nfully grown'
                : 'Feed Spike Now?'}
            </Text>

            <Pressable
              style={styles.modalOk}
              onPress={() => {
                if (modal === 'confirm') doFeed();
                else setModal(null);
              }}
            >
              <Text style={styles.modalOkText}>Ok</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

const BTN_H = IS_VERY_TINY ? 40 : IS_TINY ? 42 : 46;

const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#8FE6FF',
    fontWeight: '900',
    fontSize: IS_VERY_TINY ? 18 : 20,
  },

  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  counterIcon: { width: 16, height: 16 },
  counterText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: IS_VERY_TINY ? 10 : 18,
    paddingHorizontal: 22,
  },

  spikeWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: IS_VERY_TINY ? 6 : 12,
  },
  spikeImg: {
    width: Math.min(W * 0.72, 340),
    height: IS_VERY_TINY ? 260 : IS_TINY ? 290 : IS_SMALL ? 320 : 360,
  },

  feedBtn: {
    marginTop: IS_VERY_TINY ? 6 : 10,
    height: 28,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F4B63A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  feedText: {
    color: '#2A1906',
    fontWeight: '900',
    fontSize: 12,
  },

  menuList: {
    width: '100%',
    marginTop: IS_VERY_TINY ? 12 : 16,
    gap: IS_VERY_TINY ? 8 : 10,
    paddingBottom: 24,
  },

  menuBtn: {
    height: BTN_H,
    borderRadius: 8,
    backgroundColor: '#78B8FF',
    borderWidth: 2,
    borderColor: '#F4B63A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  menuBtnText: {
    color: '#2A1906',
    fontWeight: '900',
    fontSize: IS_VERY_TINY ? 12 : 13,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  modalCard: {
    width: Math.min(W - 60, 260),
    borderRadius: 12,
    backgroundColor: '#F4B63A',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },

  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalX: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalXText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1906',
    lineHeight: 18,
    marginTop: -1,
  },

  modalText: {
    marginTop: 6,
    textAlign: 'center',
    color: '#2A1906',
    fontWeight: '900',
    fontSize: 12,
    lineHeight: 16,
  },

  modalOk: {
    marginTop: 12,
    alignSelf: 'center',
    width: 70,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7B3D11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOkText: {
    color: '#FFDFA8',
    fontWeight: '900',
    fontSize: 11,
  },
});
