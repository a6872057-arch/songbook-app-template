import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Song } from './library';

type Props = { songs: Song[]; onOpen: (song: Song) => void };
const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['清除', '0', '⌫']];
const colors = { ink: '#273a34', muted: '#708077', green: '#2f6554', card: '#fffdf8', border: '#e1e5dd' };

export function NumberPicker({ songs, onOpen }: Props) {
  const [digits, setDigits] = useState('');
  const number = digits ? digits.padStart(3, '0') : '';
  const song = useMemo(() => songs.find(item => item.number === number), [songs, number]);

  const press = (key: string) => {
    if (key === '清除') setDigits('');
    else if (key === '⌫') setDigits(value => value.slice(0, -1));
    else setDigits(value => value.length < 3 ? value + key : value);
  };
  const confirm = () => {
    if (!digits) return Alert.alert('請輸入編號', '請按數字鍵選擇歌曲。');
    if (!song) return Alert.alert('找不到歌曲', `目前沒有第 ${number} 首，請更正編號。`);
    onOpen(song);
  };

  return <ScrollView contentContainerStyle={styles.screen}>
    <Text style={styles.instructions}>輸入歌曲編號，例如 1 可開啟第 001 首。</Text>
    <View style={styles.display} accessibilityLiveRegion="polite">
      <Text style={styles.number}>{number || '— — —'}</Text>
      <Text style={styles.songTitle}>{digits ? song?.title ?? '找不到這個編號' : '請輸入編號'}</Text>
      {song ? <Text style={styles.category}>{song.category}</Text> : null}
    </View>
    <View style={styles.keypad}>
      {rows.map((row, index) => <View key={index} style={styles.row}>
        {row.map(key => <TouchableOpacity
          key={key}
          accessibilityRole="button"
          accessibilityLabel={key === '⌫' ? '刪除一位' : key === '清除' ? '清除編號' : `輸入 ${key}`}
          style={[styles.key, key === '清除' && styles.utilityKey, key === '⌫' && styles.utilityKey]}
          onPress={() => press(key)}
        ><Text style={[styles.keyText, (key === '清除' || key === '⌫') && styles.utilityText]}>{key}</Text></TouchableOpacity>)}
      </View>)}
    </View>
    <TouchableOpacity accessibilityRole="button" style={styles.confirm} onPress={confirm}>
      <Text style={styles.confirmText}>確定 · 查看歌曲</Text>
    </TouchableOpacity>
    <Text style={styles.hint}>目前共有 {songs.length} 首歌曲，可到「目錄」查看編號。有音檔的歌曲可直接播放。</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, paddingBottom: 28, gap: 14 },
  instructions: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  display: { minHeight: 128, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  number: { color: colors.green, fontSize: 42, fontWeight: '800', letterSpacing: 5 },
  songTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  category: { color: colors.muted, fontSize: 14, marginTop: 3, textAlign: 'center' },
  keypad: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  key: { flex: 1, minHeight: 64, borderRadius: 16, backgroundColor: '#e6efe7', alignItems: 'center', justifyContent: 'center' },
  utilityKey: { backgroundColor: '#eaece7' },
  keyText: { color: colors.green, fontSize: 29, fontWeight: '700' },
  utilityText: { fontSize: 20, color: colors.ink },
  confirm: { backgroundColor: colors.green, borderRadius: 16, minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontSize: 19, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
