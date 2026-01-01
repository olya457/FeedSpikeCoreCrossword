import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
const IS_VERY_SMALL = H < 640;

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

  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;

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
    row: p.row - minR + pad,
    col: p.col - minC + pad,
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

function calcKeyboardHeights() {
  const small = IS_VERY_SMALL;
  const keyH = small ? 30 : 36;
  const topBtnH = small ? 36 : 40;
  const gap = small ? 6 : 8;
  const padTop = small ? 10 : 12;
  const padBottom = small ? 10 : 12;

  const kbHeight = padTop + topBtnH + gap + keyH * 3 + gap * 2 + padBottom;

  return { kbHeight, keyH, topBtnH, gap, padTop, padBottom, small };
}

function KeyboardPanel({
  onKey,
  onBackspace,
  onConfirm,
  bottomGap,
}: {
  onKey: (ch: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
  bottomGap: number;
}) {
  const ROWS: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  const { kbHeight, keyH, topBtnH, gap, padTop, padBottom, small } = calcKeyboardHeights();

  const renderRow = (letters: string[], rowWidth: number, isLast?: boolean) => {
    return (
      <View style={[styles.kbRowNoWrap, { width: rowWidth, marginBottom: isLast ? 0 : gap }]}>
        {letters.map(ch => (
          <Pressable
            key={ch}
            onPress={() => onKey(ch)}
            style={[
              styles.kbKeyFlex,
              {
                height: keyH,
                marginHorizontal: gap / 2,
              },
            ]}
            hitSlop={8}
          >
            <Text style={[styles.kbKeyText, { fontSize: small ? 13 : 14 }]}>{ch}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={{ paddingBottom: bottomGap }}>
      <View
        style={[
          styles.kbWrapCompact,
          {
            height: kbHeight,
            paddingTop: padTop,
            paddingHorizontal: small ? 10 : 12,
            paddingBottom: padBottom,
          },
        ]}
      >
        <View style={[styles.kbTopRow, { marginBottom: gap, gap }]}>
          <Pressable
            onPress={onBackspace}
            style={[styles.kbActionBtn, { height: topBtnH, width: small ? 48 : 52 }]}
            hitSlop={10}
          >
            <Text style={[styles.kbActionText, { fontSize: small ? 16 : 18 }]}>⌫</Text>
          </Pressable>

          <Pressable onPress={onConfirm} style={[styles.kbConfirmBtn, { height: topBtnH }]} hitSlop={10}>
            <Text style={[styles.kbConfirmText, { fontSize: small ? 12 : 13 }]}>CONFIRM</Text>
          </Pressable>
        </View>

        {renderRow(ROWS[0], Math.min(W - 36, 360))}
        {renderRow(ROWS[1], Math.min(W - 76, 320))}
        {renderRow(ROWS[2], Math.min(W - 96, 280), true)}
      </View>
    </View>
  );
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
  const { map: answerMap, conflicts } = useMemo(() => buildAnswerMapWithConflictsCheck(placed), [placed]);

  const [filled, setFilled] = useState<Record<CellKey, string>>({});
  const [activeNum, setActiveNum] = useState<number>(placed[0]?.num ?? 1);
  const [activeCells, setActiveCells] = useState<Array<{ row: number; col: number }>>([]);
  const [cursor, setCursor] = useState<{ row: number; col: number } | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const solvedMap = useMemo(() => {
    const m: Record<number, boolean> = {};
    for (const w of placed) m[w.num] = isWordCorrect(w, filled);
    return m;
  }, [placed, filled]);

  const allSolved = useMemo(() => placed.length > 0 && placed.every(w => solvedMap[w.num]), [placed, solvedMap]);

  const selectWord = (num: number) => {
    const w = placed.find(x => x.num === num);
    if (!w) return;

    setActiveNum(num);
    const cells = cellsOfPlacedWord(w.row, w.col, w.dir, w.answer);
    setActiveCells(cells);
    setCursor(firstEmptyCellInWord(w, filled));
    setShowKeyboard(true);
  };

  useEffect(() => {
    setFilled({});
    const firstNum = placed[0]?.num ?? 1;
    setActiveNum(firstNum);

    const w = placed.find(x => x.num === firstNum) ?? placed[0];
    const cells = w ? cellsOfPlacedWord(w.row, w.col, w.dir, w.answer) : [];
    setActiveCells(cells);
    setCursor(w ? firstEmptyCellInWord(w, {}) : null);

    setShowKeyboard(false);
  }, [level, placed]);

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
      return;
    }

    const owner = placed.find(w =>
      cellsOfPlacedWord(w.row, w.col, w.dir, w.answer).some(p => p.row === row && p.col === col),
    );

    if (owner) {
      setActiveNum(owner.num);
      const cells = cellsOfPlacedWord(owner.row, owner.col, owner.dir, owner.answer);
      setActiveCells(cells);
      setCursor({ row, col });
      return;
    }

    setCursor({ row, col });
  };

  const KB_BOTTOM_GAP = insets.bottom + 30;
  const { kbHeight } = calcKeyboardHeights();

  const headerTop = insets.top + 10;
  const headerH = 44;
  const bodyTopPad = IS_TINY ? 14 : 18;
  const bodyHoriz = 18;

  const clueHeaderH = showKeyboard ? (IS_VERY_SMALL ? 40 : 46) : 0;
  const spacingBetween = showKeyboard ? (IS_VERY_SMALL ? 10 : 12) : (IS_SMALL ? 14 : 16);

  const reservedHWhenKeyboard =
    headerTop + headerH + bodyTopPad + spacingBetween + clueHeaderH + kbHeight + KB_BOTTOM_GAP + 10;

  const availableForGrid = showKeyboard ? Math.max(200, H - reservedHWhenKeyboard) : Math.min(H * 0.55, 420);

  const size = layout.size;

  const maxGridByWidth = Math.min(W - (bodyHoriz * 2) - 28, 340);
  const maxGridSide = Math.floor(Math.min(maxGridByWidth, availableForGrid));

  const CELL = Math.max(20, Math.floor(maxGridSide / size));
  const GRID_W = CELL * size;

  const cardOuterW = GRID_W + 28;

  const contentNeedsScroll = showKeyboard && (IS_SMALL || GRID_W > availableForGrid);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.header, { marginTop: headerTop }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          Crossword {dataLevel.id} — {dataLevel.title}
        </Text>

        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: bodyTopPad, paddingHorizontal: bodyHoriz, paddingBottom: showKeyboard ? 0 : insets.bottom + 16 },
        ]}
        scrollEnabled={contentNeedsScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.card, { width: cardOuterW, padding: 14, alignSelf: 'center' }]}>
          <View style={{ width: GRID_W, height: GRID_W }}>
            {Array.from({ length: size }).map((_, r) =>
              Array.from({ length: size }).map((__, c) => {
                const key = ck(r, c);
                if (!cellSet.has(key)) return null;

                const val = filled[key] ?? '';
                const isCursor = !!cursor && cursor.row === r && cursor.col === c;
                const inActive = activeCells.some(p => p.row === r && p.col === c);

                const correct = answerMap.get(key);
                const isCorrect = !!correct && val === correct;

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
                    {numMap.has(key) && <Text style={[styles.num, { fontSize: Math.max(9, Math.floor(CELL * 0.32)) }]}>{numMap.get(key)}</Text>}
                    <Text style={[styles.letter, { fontSize: Math.max(14, Math.floor(CELL * 0.58)) }]}>{val || (isCursor ? '' : '?')}</Text>
                  </Pressable>
                );
              }),
            )}
          </View>
        </View>

        <View style={[styles.cluesWrap, { marginTop: spacingBetween }]}>
          {!showKeyboard ? (
            <View>
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
                      <Text style={styles.clueText} numberOfLines={2}>
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
            </View>
          ) : (
            <View>
              <View style={styles.kbHeader}>
                <Text style={styles.kbHeaderText} numberOfLines={2}>
                  {activeNum}. {placed.find(p => p.num === activeNum)?.clue ?? ''}
                </Text>
              </View>

              <KeyboardPanel
                onKey={setLetterAtCursor}
                onBackspace={backspaceAtCursor}
                onConfirm={() => setShowKeyboard(false)}
                bottomGap={KB_BOTTOM_GAP}
              />
            </View>
          )}
        </View>
      </ScrollView>
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
    height: 44,
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

  title: {
    color: '#8FE6FF',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  card: {
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
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
  },

  letter: {
    fontWeight: '900',
    color: '#fff',
    marginTop: 2,
  },

  cluesWrap: { flex: 1 },

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

  centerMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  msgText: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontSize: 13, lineHeight: 18 },

  kbHeader: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: IS_VERY_SMALL ? 6 : 8,
    marginBottom: IS_VERY_SMALL ? 6 : 8,
  },
  kbHeaderText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: IS_VERY_SMALL ? 11 : 12,
    lineHeight: IS_VERY_SMALL ? 14 : 16,
    opacity: 0.95,
  },

  kbWrapCompact: {
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  kbTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  kbActionBtn: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbActionText: { color: '#fff', fontWeight: '900', marginTop: -1 },

  kbConfirmBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F4B63A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  kbConfirmText: { color: '#2A1906', fontWeight: '900' },

  kbRowNoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  kbKeyFlex: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbKeyText: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginTop: 1,
  },
});
