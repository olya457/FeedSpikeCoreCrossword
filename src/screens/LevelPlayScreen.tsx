import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CROSSWORDS } from '../data/crosswords';

type Props = NativeStackScreenProps<RootStackParamList, 'LevelPlay'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 690;
const IS_SMALL = H < 760;

const BG = require('../assets/background.png');

type Dir = 'across' | 'down';

type LayoutWord = {
  num: number; 
  dir: Dir;
  row: number;
  col: number;
};

type CellKey = string;
const ck = (r: number, c: number) => `${r},${c}`;
const STORAGE_FRUITS = 'spike_fruits_v1';
const STORAGE_STAGE = 'spike_stage_v1';
const STORAGE_DONE_LEVELS = 'crossword_done_levels_v1';
const STORAGE_UNLOCKED = 'crossword_unlocked_v1';

const MANUAL_LAYOUTS: Record<number, { size: number; words: LayoutWord[] }> = {
  1: {
    size: 7,
    words: [
      { num: 1, dir: 'down', row: 0, col: 4 },
      { num: 2, dir: 'down', row: 1, col: 3 }, 
      { num: 3, dir: 'across', row: 2, col: 2 },
      { num: 4, dir: 'across', row: 3, col: 0 }, 
    ],
  },
  2: {
    size: 7,
    words: [
      { num: 1, dir: 'down', row: 1, col: 3 }, 
      { num: 2, dir: 'across', row: 2, col: 1 }, 
      { num: 3, dir: 'down', row: 0, col: 5 }, 
    ],
  },
};

function safeParseNumberArray(raw: string | null): number[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    return v.map(Number).filter(n => Number.isFinite(n));
  } catch {
    return [];
  }
}

function onlyAZLast(txt: string) {
  const up = (txt ?? '').toUpperCase();
  if (!up) return '';
  const last = up[up.length - 1];
  return /[A-Z]/.test(last) ? last : '';
}

function cellsOfPlacedWord(row: number, col: number, dir: Dir, answer: string) {
  const A = answer.toUpperCase();
  const res: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < A.length; i++) {
    res.push({
      row: row + (dir === 'down' ? i : 0),
      col: col + (dir === 'across' ? i : 0),
    });
  }
  return res;
}

function buildCellSet(placed: Array<{ row: number; col: number; dir: Dir; answer: string }>) {
  const set = new Set<CellKey>();
  for (const w of placed) {
    for (const p of cellsOfPlacedWord(w.row, w.col, w.dir, w.answer)) {
      set.add(ck(p.row, p.col));
    }
  }
  return set;
}

function buildNumbersMap(placed: Array<{ row: number; col: number; num: number }>) {
  const map = new Map<CellKey, number>();
  for (const w of placed) map.set(ck(w.row, w.col), w.num);
  return map;
}

function buildAnswerMapWithConflictsCheck(
  placed: Array<{ row: number; col: number; dir: Dir; answer: string }>,
) {
  const map = new Map<CellKey, string>();
  const conflicts: Array<{ key: string; a: string; b: string }> = [];

  for (const w of placed) {
    const A = w.answer.toUpperCase();
    for (let i = 0; i < A.length; i++) {
      const r = w.row + (w.dir === 'down' ? i : 0);
      const c = w.col + (w.dir === 'across' ? i : 0);
      const key = ck(r, c);
      const ch = A[i];

      const existed = map.get(key);
      if (existed && existed !== ch) conflicts.push({ key, a: existed, b: ch });
      else map.set(key, ch);
    }
  }

  return { map, conflicts };
}

function firstEmptyCellInWord(
  word: { row: number; col: number; dir: Dir; answer: string },
  filled: Record<CellKey, string>,
) {
  const cells = cellsOfPlacedWord(word.row, word.col, word.dir, word.answer);
  for (const p of cells) {
    const key = ck(p.row, p.col);
    if (!filled[key]) return p;
  }
  return cells[0] ?? null;
}

function isWordCorrect(
  word: { row: number; col: number; dir: Dir; answer: string },
  filled: Record<CellKey, string>,
) {
  const A = word.answer.toUpperCase();
  const cells = cellsOfPlacedWord(word.row, word.col, word.dir, word.answer);
  for (let i = 0; i < cells.length; i++) {
    const key = ck(cells[i].row, cells[i].col);
    if ((filled[key] ?? '') !== A[i]) return false;
  }
  return true;
}

type AutoPlaced = { num: number; dir: Dir; row: number; col: number; answer: string };

function autoLayout(words: Array<{ answer: string }>) {
  const answers = words.map(w => (w.answer ?? '').toUpperCase().replace(/[^A-Z]/g, ''));
  const list = answers.map((answer, idx) => ({ num: idx + 1, answer })).filter(x => x.answer.length > 0);

  if (list.length === 0) return { size: 7, words: [] as LayoutWord[] };

  const sorted = [...list].sort((a, b) => b.answer.length - a.answer.length);

  const placed: AutoPlaced[] = [];
  const grid = new Map<CellKey, string>();

  const canPlace = (row: number, col: number, dir: Dir, word: string) => {
    for (let i = 0; i < word.length; i++) {
      const r = row + (dir === 'down' ? i : 0);
      const c = col + (dir === 'across' ? i : 0);
      const key = ck(r, c);
      const existing = grid.get(key);
      if (existing && existing !== word[i]) return false;
    }
    return true;
  };

  const doPlace = (num: number, row: number, col: number, dir: Dir, word: string) => {
    for (let i = 0; i < word.length; i++) {
      const r = row + (dir === 'down' ? i : 0);
      const c = col + (dir === 'across' ? i : 0);
      grid.set(ck(r, c), word[i]);
    }
    placed.push({ num, row, col, dir, answer: word });
  };

  const first = sorted[0];
  doPlace(first.num, 0, 0, 'down', first.answer);

  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    const word = w.answer;

    let best: { row: number; col: number; dir: Dir } | null = null;

    for (const p of placed) {
      const pWord = p.answer;

      for (let a = 0; a < word.length; a++) {
        const ch = word[a];
        for (let b = 0; b < pWord.length; b++) {
          if (pWord[b] !== ch) continue;

          if (p.dir === 'down') {
            const crossRow = p.row + b;
            const crossCol = p.col;
            const tryRow = crossRow;
            const tryCol = crossCol - a;
            if (canPlace(tryRow, tryCol, 'across', word)) {
              best = { row: tryRow, col: tryCol, dir: 'across' };
              break;
            }
          } else {
            const crossRow = p.row;
            const crossCol = p.col + b;
            const tryRow = crossRow - a;
            const tryCol = crossCol;
            if (canPlace(tryRow, tryCol, 'down', word)) {
              best = { row: tryRow, col: tryCol, dir: 'down' };
              break;
            }
          }
        }
        if (best) break;
      }
      if (best) break;
    }

    if (best) {
      doPlace(w.num, best.row, best.col, best.dir, word);
    } else {
      let maxRow = 0;
      for (const key of grid.keys()) {
        const r = Number(key.split(',')[0]);
        if (r > maxRow) maxRow = r;
      }
      doPlace(w.num, maxRow + 2, 0, 'across', word);
    }
  }

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const key of grid.keys()) {
    const [rs, cs] = key.split(',');
    const r = Number(rs);
    const c = Number(cs);
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }

  const pad = 1;
  const size = Math.max(maxR - minR + 1, maxC - minC + 1) + pad * 2;
  const finalSize = Math.max(7, Math.min(13, size));

  const wordsOut: LayoutWord[] = placed.map(p => ({
    num: p.num,
    dir: p.dir,
    row: (p.row - minR) + pad,
    col: (p.col - minC) + pad,
  }));

  return { size: finalSize, words: wordsOut };
}

async function completeLevelAndSync(levelId: number, total: number) {
  try {
    const [[, rawDone], [, rawUnlocked]] = await AsyncStorage.multiGet([
      STORAGE_DONE_LEVELS,
      STORAGE_UNLOCKED,
    ]);

    const done = safeParseNumberArray(rawDone);
    const unlockedNum = rawUnlocked ? Number(rawUnlocked) : 1;
    const unlocked = Number.isFinite(unlockedNum) ? unlockedNum : 1;

    const has = done.includes(levelId);
    const nextDone = has ? done : [...done, levelId].sort((a, b) => a - b);

    const nextFruits = nextDone.length; 
    const nextUnlocked = Math.max(unlocked, Math.min(total, levelId + 1));

    await AsyncStorage.multiSet([
      [STORAGE_DONE_LEVELS, JSON.stringify(nextDone)],
      [STORAGE_FRUITS, String(nextFruits)],
      [STORAGE_UNLOCKED, String(nextUnlocked)],
    ]);

    return { nextDone, nextFruits, nextUnlocked };
  } catch {
    return null;
  }
}

export default function LevelPlayScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { level, onComplete } = route.params;

  const dataLevel = useMemo(() => CROSSWORDS.find(l => l.id === level), [level]);

  if (!dataLevel) {
    return (
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <View style={[styles.header, { marginTop: insets.top + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Crossword {level}</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.centerMsg}>
          <Text style={styles.msgText}>Level not found in CROSSWORDS.</Text>
        </View>
      </ImageBackground>
    );
  }

  const TOTAL = 50; 

  const layout = useMemo(() => {
    const manual = MANUAL_LAYOUTS[level];
    if (manual) return manual;
    return autoLayout(dataLevel.words);
  }, [level, dataLevel.words]);

  const placed = useMemo(() => {
    return layout.words.map(w => ({
      num: w.num,
      row: w.row,
      col: w.col,
      dir: w.dir,
      clue: dataLevel.words[w.num - 1]?.clue ?? '',
      answer: (dataLevel.words[w.num - 1]?.answer ?? '').toUpperCase(),
    }));
  }, [layout.words, dataLevel.words]);

  const cellSet = useMemo(() => buildCellSet(placed), [placed]);
  const numMap = useMemo(() => buildNumbersMap(placed), [placed]);
  const { map: answerMap, conflicts } = useMemo(
    () => buildAnswerMapWithConflictsCheck(placed),
    [placed],
  );

  const [filled, setFilled] = useState<Record<CellKey, string>>({});
  const [activeNum, setActiveNum] = useState<number>(placed[0]?.num ?? 1);
  const [activeCells, setActiveCells] = useState<Array<{ row: number; col: number }>>([]);
  const [cursor, setCursor] = useState<{ row: number; col: number } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const lastTextRef = useRef<string>('');
  const [hiddenText, setHiddenText] = useState('');

  const solvedMap = useMemo(() => {
    const m: Record<number, boolean> = {};
    for (const w of placed) m[w.num] = isWordCorrect(w, filled);
    return m;
  }, [placed, filled]);

  const allSolved = useMemo(
    () => placed.length > 0 && placed.every(w => solvedMap[w.num]),
    [placed, solvedMap],
  );

  const focusKeyboard = () => {
    Keyboard.dismiss();
    setTimeout(() => inputRef.current?.focus(), Platform.OS === 'android' ? 120 : 60);
  };

  const selectWord = (num: number) => {
    const w = placed.find(x => x.num === num);
    if (!w) return;

    setActiveNum(num);

    const cells = cellsOfPlacedWord(w.row, w.col, w.dir, w.answer);
    setActiveCells(cells);

    const first = firstEmptyCellInWord(w, filled);
    setCursor(first);

    lastTextRef.current = '';
    setHiddenText('');
    focusKeyboard();
  };

  useEffect(() => {
    setFilled({});
    const firstNum = placed[0]?.num ?? 1;
    setActiveNum(firstNum);

    const w = placed.find(x => x.num === firstNum) ?? placed[0];
    const cells = w ? cellsOfPlacedWord(w.row, w.col, w.dir, w.answer) : [];
    setActiveCells(cells);
    setCursor(w ? firstEmptyCellInWord(w, {}) : null);

    lastTextRef.current = '';
    setHiddenText('');
    setTimeout(() => focusKeyboard(), 250);
  }, [level]);

  const moveNext = () => {
    if (!cursor) return;
    const idx = activeCells.findIndex(p => p.row === cursor.row && p.col === cursor.col);
    if (idx < 0) return;
    const next = activeCells[idx + 1];
    if (next) setCursor(next);
  };

  const setLetterAtCursor = (letter: string) => {
    if (!cursor) return;
    const key = ck(cursor.row, cursor.col);
    setFilled(prev => ({ ...prev, [key]: letter }));
    moveNext();
  };

  const backspaceAtCursor = () => {
    if (!cursor) return;
    const key = ck(cursor.row, cursor.col);

    if (filled[key]) {
      setFilled(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
      return;
    }

    const idx = activeCells.findIndex(p => p.row === cursor.row && p.col === cursor.col);
    const prevCell = idx > 0 ? activeCells[idx - 1] : null;
    if (!prevCell) return;

    setCursor(prevCell);
    const pk = ck(prevCell.row, prevCell.col);
    setFilled(prev => {
      const n = { ...prev };
      delete n[pk];
      return n;
    });
  };

  const onChangeHidden = (txt: string) => {
    const prev = lastTextRef.current;
    lastTextRef.current = txt;

    if (prev.length > txt.length) {
      backspaceAtCursor();
      return;
    }

    const ch = onlyAZLast(txt);
    if (!ch) return;

    setLetterAtCursor(ch);

    requestAnimationFrame(() => {
      setHiddenText('');
      lastTextRef.current = '';
    });
  };
  useEffect(() => {
    if (!allSolved) return;

    let alive = true;

    const run = async () => {
      await completeLevelAndSync(level, TOTAL);
      if (!alive) return;

      const t = setTimeout(() => {
        const next = level + 1;
        const hasNext = next <= TOTAL && CROSSWORDS.some(l => l.id === next);

        if (hasNext) {
          navigation.replace('LevelPlay', { level: next, onComplete } as any);
        } else {
          onComplete?.();
          navigation.goBack();
        }
      }, 450);

      return () => clearTimeout(t);
    };

    run();

    return () => {
      alive = false;
    };
  }, [allSolved, level, navigation, onComplete]);

  const onPressCell = (row: number, col: number) => {
    const key = ck(row, col);
    if (!cellSet.has(key)) return;

    const insideActive = activeCells.some(p => p.row === row && p.col === col);
    if (insideActive) {
      setCursor({ row, col });
      focusKeyboard();
      return;
    }

    const owner = placed.find(w =>
      cellsOfPlacedWord(w.row, w.col, w.dir, w.answer).some(p => p.row === row && p.col === col),
    );
    if (owner) {
      selectWord(owner.num);
      setCursor({ row, col });
      return;
    }

    setCursor({ row, col });
    focusKeyboard();
  };

  const size = layout.size;
  const CARD_W = Math.min(W - 44, 340);
  const CELL = Math.floor(CARD_W / size);
  const GRID_W = CELL * size;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <TextInput
        ref={inputRef}
        value={hiddenText}
        onChangeText={onChangeHidden}
        autoCorrect={false}
        autoCapitalize="characters"
        keyboardType={Platform.select({ ios: 'ascii-capable', android: 'visible-password' }) as any}
        textContentType="none"
        caretHidden
        contextMenuHidden
        showSoftInputOnFocus
        blurOnSubmit={false}
        style={styles.hiddenInput}
      />

      <View style={[styles.header, { marginTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.title}>
          Crossword {dataLevel.id} — {dataLevel.title}
        </Text>

        <View style={{ width: 34 }} />
      </View>

      <View style={styles.body}>
        <Pressable onPress={focusKeyboard} style={[styles.card, { width: GRID_W + 28, padding: 14 }]}>
          <View style={{ width: GRID_W, height: GRID_W }}>
            {Array.from({ length: size }).map((_, r) =>
              Array.from({ length: size }).map((__, c) => {
                const key = ck(r, c);
                if (!cellSet.has(key)) return null;

                const val = filled[key] ?? '';
                const isCursor = !!cursor && cursor.row === r && cursor.col === c;
                const inActive = activeCells.some(p => p.row === r && p.col === c);

                const correct = answerMap.get(key);
                const isCorrect = correct && val === correct;

                return (
                  <Pressable
                    key={key}
                    onPress={() => onPressCell(r, c)}
                    style={[
                      styles.cell,
                      {
                        width: CELL,
                        height: CELL,
                        left: c * CELL,
                        top: r * CELL,
                        backgroundColor: inActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                        borderColor: isCursor
                          ? '#FFFFFF'
                          : inActive
                          ? 'rgba(255,255,255,0.25)'
                          : 'rgba(255,255,255,0.12)',
                      },
                      isCorrect && styles.cellCorrect,
                    ]}
                  >
                    {numMap.has(key) && <Text style={styles.num}>{numMap.get(key)}</Text>}
                    <Text style={styles.letter}>{val || (isCursor ? '' : '?')}</Text>
                  </Pressable>
                );
              }),
            )}
          </View>
        </Pressable>

        <View style={styles.cluesWrap}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 14 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {placed
              .slice()
              .sort((a, b) => a.num - b.num)
              .map(w => {
                const active = w.num === activeNum;
                const solved = !!solvedMap[w.num];
                return (
                  <Pressable
                    key={w.num}
                    onPress={() => selectWord(w.num)}
                    style={[styles.clueBtn, active && styles.clueBtnActive, solved && styles.clueBtnSolved]}
                  >
                    <Text style={styles.clueText}>
                      {w.num}. {w.clue}
                    </Text>
                  </Pressable>
                );
              })}

            {conflicts.length > 0 && (
              <Text style={styles.warn}>
                Layout conflict: answers intersect with different letters. Check word list / layout.
              </Text>
            )}
          </ScrollView>
        </View>
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

  title: { color: '#8FE6FF', fontWeight: '900', fontSize: 16, textAlign: 'center' },

  body: { flex: 1, paddingTop: IS_TINY ? 14 : 18, paddingHorizontal: 18 },

  card: {
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  cell: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cellCorrect: {
    backgroundColor: 'rgba(120,255,140,0.20)',
    borderColor: 'rgba(120,255,140,0.65)',
  },

  num: {
    position: 'absolute',
    left: 5,
    top: 3,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
  },

  letter: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    marginTop: 2,
  },

  cluesWrap: { flex: 1, marginTop: IS_SMALL ? 14 : 16 },

  clueBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F4B63A',
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  clueBtnActive: { backgroundColor: '#FFC45A' },
  clueBtnSolved: { opacity: 0.78 },

  clueText: { color: '#2A1906', fontWeight: '900', fontSize: 13, lineHeight: 16 },

  warn: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 10,
  },

  hiddenInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    opacity: 0.02,
  },

  centerMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  msgText: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontSize: 13, lineHeight: 18 },
});
