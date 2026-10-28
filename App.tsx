import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import songCatalog from './catalog.json';
import appConfig from './app.json';
import { mergeLibrary, type Song } from './library';
import { SongScore } from './SongScore';
import { NumberPicker } from './NumberPicker';
import { scoreSources } from './scoreSources';
import { bundledAudio, bundledAudioDescriptions } from './bundledAudio';

type Tab = 'number' | 'library' | 'favorites' | 'playlist' | 'import';
type AudioMatch = { asset: DocumentPicker.DocumentPickerAsset; song?: Song; issue?: string };
const BUILT_IN: Song[] = songCatalog;
const C = { ink: '#273a34', muted: '#708077', green: '#2f6554', cream: '#f7f4ec', card: '#fffdf8', border: '#e1e5dd' };
const KEY = `${appConfig.expo.slug}:library:v1`;
function isSong(value: unknown): value is Song {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Song>;
  return typeof s.id === 'string' && typeof s.number === 'string' && typeof s.title === 'string' && typeof s.category === 'string' && Array.isArray(s.lyrics) && s.lyrics.every(x => typeof x === 'string') && (s.audioUrl === undefined || typeof s.audioUrl === 'string');
}

const readerStyles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  selectedTab: { backgroundColor: C.green },
  tabText: { color: C.green, fontSize: 17, fontWeight: '700' },
  selectedTabText: { color: '#fff' },
});

export default function App() {
  const [tab, setTab] = useState<Tab>('number');
  const [songs, setSongs] = useState<Song[]>(BUILT_IN);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [fontSize, setFontSize] = useState(22);
  const [loaded, setLoaded] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [lyricsDraft, setLyricsDraft] = useState('');
  const [detailView, setDetailView] = useState<'lyrics' | 'score'>('lyrics');
  const [audioMatches, setAudioMatches] = useState<AudioMatch[]>([]);
  const [importingAudio, setImportingAudio] = useState(false);
  const player = useAudioPlayer(null);
  const audio = useAudioPlayerStatus(player);
  const loadedAudio = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (!raw) return;
      const saved = JSON.parse(raw);
      const savedFavorites = Array.isArray(saved.favorites) ? saved.favorites.filter((x: unknown): x is string => typeof x === 'string') : [];
      const savedPlaylist = Array.isArray(saved.playlist) ? saved.playlist.filter((x: unknown): x is string => typeof x === 'string') : [];
      if (Array.isArray(saved.songs)) {
        const existing: Song[] = saved.songs.filter(isSong);
        setSongs(mergeLibrary(existing, BUILT_IN));
      }
      setFavorites(savedFavorites);
      setPlaylist(savedPlaylist);
      if (typeof saved.fontSize === 'number') setFontSize(saved.fontSize);
    }).catch(() => Alert.alert('讀取失敗', '無法載入本機歌曲資料。')).finally(() => setLoaded(true));
  }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ songs, favorites, playlist, fontSize })).catch(() => Alert.alert('儲存失敗', '請檢查手機可用空間。')); }, [songs, favorites, playlist, fontSize, loaded]);

  const current = songs.find(s => s.id === selected);
  const shown = useMemo(() => {
    const base = tab === 'favorites' ? songs.filter(s => favorites.includes(s.id)) : tab === 'playlist' ? playlist.map(id => songs.find(s => s.id === id)).filter((s): s is Song => Boolean(s)) : songs;
    const q = query.trim().toLocaleLowerCase();
    return q ? base.filter(s => [s.title, s.number, s.category, ...s.lyrics].join(' ').toLocaleLowerCase().includes(q)) : base;
  }, [tab, songs, favorites, playlist, query]);
  const toggle = (id: string, values: string[], set: (next: string[]) => void) => set(values.includes(id) ? values.filter(x => x !== id) : [...values, id]);
  const openSong = (song: Song) => {
    setSelected(song.id);
    setDetailView('lyrics');
    setLyricsDraft(song.lyrics.join('\n\n'));
    setEditingLyrics(false);
  };
  const pickBatchAudio = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'audio/*', multiple: true, copyToCacheDirectory: true });
      if (picked.canceled) return;
      const seen = new Set<string>();
      const matches = picked.assets.map((asset): AudioMatch => {
        if (!/\.mp3$/i.test(asset.name)) return { asset, issue: '不是 MP3 檔案' };
        const prefix = asset.name.match(/^\s*(\d{1,3})(?=[\s._\-、])/);
        if (!prefix) return { asset, issue: '檔名開頭沒有歌曲編號' };
        const number = prefix[1].padStart(3, '0');
        const song = songs.find(item => item.number === number);
        if (!song) return { asset, issue: `找不到第 ${number} 首` };
        if (seen.has(number)) return { asset, issue: `第 ${number} 首重複，請只選一個音檔` };
        seen.add(number);
        return { asset, song };
      });
      setAudioMatches(matches);
    } catch (e) { Alert.alert('無法選取音檔', e instanceof Error ? e.message : '請重試。'); }
  };
  const confirmBatchAudio = async () => {
    if (importingAudio) return;
    const ready = audioMatches.filter((match): match is AudioMatch & { song: Song } => Boolean(match.song));
    if (!ready.length) return;
    setImportingAudio(true);
    const updates = new Map<string, string>();
    const failures: string[] = [];
    for (const { asset, song } of ready) {
      try {
        const destination = new File(Paths.document, `hymn-${song.number}-${Date.now()}-${Math.floor(Math.random() * 1000000)}.mp3`);
        await new File(asset.uri).copy(destination);
        updates.set(song.id, destination.uri);
      } catch { failures.push(asset.name); }
    }
    if (updates.size) setSongs(old => old.map(song => updates.has(song.id) ? { ...song, audioUrl: updates.get(song.id) } : song));
    setAudioMatches(old => old.filter(match => !match.song || !updates.has(match.song.id)));
    setImportingAudio(false);
    Alert.alert('匯入完成', `成功配對 ${updates.size} 首。${failures.length ? `\n${failures.length} 個檔案複製失敗，請重試。` : ''}`);
  };
  const importMp3 = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!/\.mp3$/i.test(asset.name)) throw new Error('目前請選擇 MP3 檔案。');
      const destination = new File(Paths.document, `song-${Date.now()}-${Math.floor(Math.random() * 1000000)}.mp3`);
      await new File(asset.uri).copy(destination);
      const number = String(Math.max(0, ...songs.map(song => Number.parseInt(song.number, 10)).filter(Number.isFinite)) + 1).padStart(3, '0');
      const song: Song = { id: `local-${Date.now()}-${Math.floor(Math.random() * 1000000)}`, number, title: asset.name.replace(/\.mp3$/i, '').trim() || `新歌曲 ${number}`, category: '我的歌曲', lyrics: [], audioUrl: destination.uri };
      setSongs(old => [...old, song]);
      setTab('library');
      openSong(song);
      Alert.alert('歌曲已加入', `已將「${song.title}」加入第 ${number} 首。`);
    } catch (e) { Alert.alert('無法加入 MP3', e instanceof Error ? e.message : '請檢查檔案。'); }
  };
  const saveLyrics = (song: Song) => {
    const lyrics = lyricsDraft.trim().split(/\n\s*\n/).map(section => section.trim()).filter(Boolean);
    setSongs(old => old.map(item => item.id === song.id ? { ...item, lyrics } : item));
    setEditingLyrics(false);
  };
  const attachAudio = async (song: Song) => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      const extension = asset.name.toLocaleLowerCase().match(/\.(mp3|m4a|aac|wav|ogg)$/)?.[1];
      if (!extension) throw new Error('請選擇 MP3、M4A、AAC、WAV 或 OGG 音檔。');
      const destination = new File(Paths.document, `song-${Date.now()}.${extension}`);
      await new File(asset.uri).copy(destination);
      setSongs(old => old.map(item => item.id === song.id ? { ...item, audioUrl: destination.uri } : item));
      Alert.alert('音檔已加入', `「${song.title}」現在可以播放。`);
    } catch (e) { Alert.alert('音檔匯入失敗', e instanceof Error ? e.message : '請重試。'); }
  };
  const audioSource = (song: Song) => song.audioUrl ?? bundledAudio[song.id];
  const play = async (song: Song) => {
    const source = audioSource(song);
    if (source === undefined) return Alert.alert('沒有音檔', '請先為這首歌曲加入音檔。');
    try {
      if (playingId === song.id && loadedAudio.current === source && audio.playing) return player.pause();
      await setAudioModeAsync({ playsInSilentMode: true });
      if (loadedAudio.current !== source) {
        player.replace(source);
        loadedAudio.current = source;
      } else if (player.duration > 0 && player.currentTime >= player.duration - 0.05) {
        await player.seekTo(0);
      }
      setPlayingId(song.id);
      player.play();
    } catch (error) {
      loadedAudio.current = undefined;
      setPlayingId(null);
      Alert.alert('播放失敗', error instanceof Error ? error.message : '請重新加入音檔後再試。');
    }
  };
  const navigate = (next: Tab) => { player.pause(); setSelected(null); setQuery(''); setTab(next); };

  const warmLyrics = Boolean(current && detailView === 'lyrics');
  return <SafeAreaView style={[st.root, warmLyrics && st.lyricsBackground]}><StatusBar style="dark" />
    <View style={[st.header, warmLyrics && st.lyricsHeader]}><Text style={[st.kicker, warmLyrics && st.lyricsHeaderText]}>{appConfig.expo.name}</Text><Text style={[st.heading, warmLyrics && st.lyricsHeaderText]}>{current ? current.title : tab === 'number' ? '輸入編號選歌' : tab === 'library' ? '歌曲目錄' : tab === 'favorites' ? '我的收藏' : tab === 'playlist' ? '播放清單' : '加入 MP3'}</Text><Text style={[st.subheading, warmLyrics && st.lyricsHeaderText]}>{current ? `${current.category} · ${current.number}` : tab === 'number' ? '按下編號，快速找到要唱的歌' : '讓每一首歌都有自己的位置'}</Text></View>
    {current ? <ScrollView style={warmLyrics && st.lyricsBackground} contentContainerStyle={st.detail}>
      <TouchableOpacity onPress={() => setSelected(null)}><Text style={st.back}>‹ 返回{tab === 'number' ? '選號' : '列表'}</Text></TouchableOpacity>
      {scoreSources[current.id] ? <View style={readerStyles.tabs}>
        {([['score', '完整樂譜'], ['lyrics', '文字歌詞']] as const).map(([value, label]) => <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{ selected: detailView === value }} style={[readerStyles.tab, detailView === value && readerStyles.selectedTab]} onPress={() => { setDetailView(value); setEditingLyrics(false); }}><Text style={[readerStyles.tabText, detailView === value && readerStyles.selectedTabText]}>{label}</Text></TouchableOpacity>)}
      </View> : null}
      {detailView === 'score' && scoreSources[current.id] ? <SongScore key={current.id} songId={current.id} title={current.title} /> : <>
        <View style={st.fontRow}><Text style={st.hint}>歌詞字體</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="縮小歌詞文字" onPress={() => setFontSize(s => Math.max(18, s - 2))}><Text style={st.fontButton}>A−</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="放大歌詞文字" onPress={() => setFontSize(s => Math.min(34, s + 2))}><Text style={st.fontButton}>A＋</Text></TouchableOpacity></View>
        <View style={[st.card, st.lyricsCard]}><Text style={st.lyricsLabel}>第 {current.number} 首</Text><Text style={[st.detailTitle, st.lyricsInk]}>{current.title}</Text>{current.musicInfo ? <Text style={[st.hint, st.lyricsInk]}>{current.musicInfo}</Text> : null}{current.lyrics.length ? current.lyrics.map((verse, i) => <View key={i} style={[st.verse, st.lyricsVerse]}><Text style={st.lyricsLabel}>{String(i + 1).padStart(2, '0')}</Text><Text selectable style={[st.lyrics, st.lyricsInk, { fontSize, lineHeight: fontSize * 1.7 }]}>{verse}</Text></View>) : <Text style={st.hint}>尚未加入歌詞。可點下方「貼上歌詞」。</Text>}</View>
        {current.sourceNotes ? <View style={[st.card, st.lyricsCard]}><Text style={[st.detailTitle, st.lyricsInk]}>經文與註記</Text><Text selectable style={[st.lyrics, st.lyricsInk, { fontSize, lineHeight: fontSize * 1.7 }]}>{current.sourceNotes}</Text></View> : null}
        {editingLyrics ? <View style={st.card}><Text style={st.detailTitle}>編輯歌詞</Text><Text style={st.hint}>可直接貼上文字；段落之間空一行。</Text><TextInput style={st.lyricsInput} multiline value={lyricsDraft} onChangeText={setLyricsDraft} placeholder="在這裡貼上歌詞" textAlignVertical="top" /><TouchableOpacity style={st.play} onPress={() => saveLyrics(current)}><Text style={st.playText}>儲存歌詞</Text></TouchableOpacity><TouchableOpacity style={st.action} onPress={() => setEditingLyrics(false)}><Text style={st.actionText}>取消</Text></TouchableOpacity></View> : <TouchableOpacity style={st.action} onPress={() => { setLyricsDraft(current.lyrics.join('\n\n')); setEditingLyrics(true); }}><Text style={st.actionText}>{current.lyrics.length ? '編輯歌詞' : '貼上歌詞（可稍後）'}</Text></TouchableOpacity>}
      </>}
      <View style={st.actions}><TouchableOpacity style={st.action} onPress={() => toggle(current.id, favorites, setFavorites)}><Text style={st.actionText}>{favorites.includes(current.id) ? '♥ 已收藏' : '♡ 收藏'}</Text></TouchableOpacity><TouchableOpacity style={st.action} onPress={() => toggle(current.id, playlist, setPlaylist)}><Text style={st.actionText}>{playlist.includes(current.id) ? '✓ 已加入歌單' : '＋ 加入歌單'}</Text></TouchableOpacity></View>
      <TouchableOpacity style={[st.play, !audioSource(current) && st.disabled]} onPress={() => play(current)}><Text style={st.playText}>{playingId === current.id && audio.playing ? '暫停播放' : audioSource(current) ? '播放音檔' : '尚未加入音檔'}</Text></TouchableOpacity>
      {!current.audioUrl && bundledAudioDescriptions[current.id] ? <Text style={st.hint}>{bundledAudioDescriptions[current.id]}</Text> : null}
      <TouchableOpacity style={st.action} onPress={() => attachAudio(current)}><Text style={st.actionText}>{audioSource(current) ? '從手機更換音檔' : '從手機加入音檔'}</Text></TouchableOpacity>
    </ScrollView> : tab === 'number' ? <NumberPicker songs={songs} onOpen={openSong} /> : tab === 'import' ? <ScrollView contentContainerStyle={st.detail}>
      <View style={st.card}><Text style={st.detailTitle}>依編號批次加入 MP3</Text><Text style={st.paragraph}>可一次選多個 MP3。檔名請以歌曲編號開頭，例如「001 - 我的歌曲.mp3」。先檢查配對結果，再確認加入。</Text>
        <TouchableOpacity style={[st.play, importingAudio && st.disabled]} disabled={importingAudio} onPress={pickBatchAudio}><Text style={st.playText}>選擇多個 MP3</Text></TouchableOpacity>
        {audioMatches.length ? <><Text style={st.hint}>已選 {audioMatches.length} 個檔案，可配對 {audioMatches.filter(match => match.song).length} 首。已有音檔的歌曲會以新檔取代。</Text>
          {audioMatches.map((match, index) => <View key={`${match.asset.uri}-${index}`} style={st.matchRow}><Text style={st.matchName}>{match.asset.name}</Text><Text style={match.song ? st.matchOk : st.matchIssue}>{match.song ? `✓ ${match.song.number} ${match.song.title}${match.song.audioUrl ? '（將更換原音檔）' : ''}` : `無法配對：${match.issue}`}</Text></View>)}
          <TouchableOpacity style={[st.play, (!audioMatches.some(match => match.song) || importingAudio) && st.disabled]} disabled={!audioMatches.some(match => match.song) || importingAudio} onPress={confirmBatchAudio}><Text style={st.playText}>{importingAudio ? '正在匯入…' : `確認配對並匯入 ${audioMatches.filter(match => match.song).length} 首`}</Text></TouchableOpacity>
          <TouchableOpacity style={st.action} disabled={importingAudio} onPress={() => setAudioMatches([])}><Text style={st.actionText}>清除選取</Text></TouchableOpacity>
        </> : null}<Text style={st.hint}>匯入的音檔儲存在這支手機中；移除 App 可能一併移除資料。</Text></View>
      <View style={st.card}><Text style={st.detailTitle}>新增一首自己的歌曲</Text><Text style={st.paragraph}>沒有對應編號時，可選一個 MP3 新增為歌曲。App 會使用檔名作為歌名並自動編號。</Text><TouchableOpacity style={st.play} onPress={importMp3}><Text style={st.playText}>新增單首 MP3</Text></TouchableOpacity></View>
    </ScrollView> : <View style={st.listArea}><TextInput style={st.search} value={query} onChangeText={setQuery} placeholder="搜尋編號、歌名或歌詞" placeholderTextColor="#89988d" /><Text style={st.count}>{shown.length} 首歌曲</Text><FlatList data={shown} keyExtractor={s => s.id} contentContainerStyle={st.list} ListEmptyComponent={<Text style={st.empty}>這裡還沒有歌曲</Text>} renderItem={({ item }) => <TouchableOpacity style={st.songCard} onPress={() => openSong(item)}><View style={st.badge}><Text style={st.badgeText}>{item.number}</Text></View><View style={st.songInfo}><Text style={st.songTitle}>{item.title}</Text><Text style={st.category}>{item.category} · {item.lyrics.length} 節</Text></View><Text style={st.chevron}>›</Text></TouchableOpacity>} /></View>}
    <View style={st.nav}>{([['number', '選號'], ['library', '目錄'], ['favorites', '收藏'], ['playlist', '歌單'], ['import', '加入 MP3']] as [Tab, string][]).map(([key, label]) => <TouchableOpacity key={key} style={st.navItem} onPress={() => navigate(key)}><Text style={[st.navText, tab === key && st.navActive]}>{label}</Text></TouchableOpacity>)}</View>
  </SafeAreaView>;
}

const st = StyleSheet.create({
  lyricsBackground: { backgroundColor: '#f9ead2' },
  lyricsHeader: { backgroundColor: '#b1844d' },
  lyricsHeaderText: { color: '#fffdf8' },
  lyricsCard: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0, paddingHorizontal: 8, paddingVertical: 12 },
  lyricsInk: { color: '#5b4b50' },
  lyricsLabel: { color: '#8b663e', fontWeight: '700', fontSize: 17 },
  lyricsVerse: { borderTopColor: '#d7c3a8' },
  root: { flex: 1, backgroundColor: C.cream }, header: { paddingHorizontal: 26, paddingTop: 25, paddingBottom: 17 }, kicker: { color: C.green, fontWeight: '700', letterSpacing: 1, fontSize: 12 }, heading: { color: C.ink, fontSize: 32, fontWeight: '700', marginTop: 7 }, subheading: { color: C.muted, marginTop: 6, fontSize: 14 }, listArea: { flex: 1, paddingHorizontal: 20 }, search: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: C.ink }, count: { color: C.muted, marginTop: 17, marginBottom: 11, marginLeft: 5 }, list: { paddingBottom: 18 }, empty: { textAlign: 'center', marginTop: 45, color: C.muted }, songCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 17, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 10 }, badge: { width: 50, height: 50, borderRadius: 13, backgroundColor: '#e6efe7', alignItems: 'center', justifyContent: 'center' }, badgeText: { color: C.green, fontWeight: '700' }, songInfo: { flex: 1, marginLeft: 14 }, songTitle: { color: C.ink, fontSize: 18, fontWeight: '700' }, category: { color: C.muted, marginTop: 5 }, chevron: { color: C.green, fontSize: 27 }, detail: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 }, back: { color: C.green, fontSize: 16, marginBottom: 18 }, card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 20, padding: 24 }, detailTitle: { color: C.ink, fontSize: 27, fontWeight: '700', marginTop: 10, marginBottom: 15 }, verse: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 22, paddingBottom: 16 }, lyrics: { color: C.ink, lineHeight: 38, marginTop: 8 }, lyricsInput: { minHeight: 180, marginTop: 12, padding: 14, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.ink, fontSize: 17, lineHeight: 25, backgroundColor: '#fff' }, actions: { flexDirection: 'row', gap: 10, marginTop: 14 }, action: { flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 13, alignItems: 'center' }, actionText: { color: C.green, fontWeight: '700' }, play: { backgroundColor: C.green, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 15 }, disabled: { opacity: .55 }, playText: { color: '#fff', fontWeight: '700', fontSize: 16 }, fontRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 23 }, hint: { color: C.muted, lineHeight: 22, marginTop: 15 }, fontButton: { color: C.green, fontSize: 19, fontWeight: '700' }, paragraph: { color: C.ink, fontSize: 16, lineHeight: 26 }, matchRow: { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 12 }, matchName: { color: C.ink, fontSize: 14 }, matchOk: { color: C.green, marginTop: 5, fontWeight: '700' }, matchIssue: { color: '#a24736', marginTop: 5 }, nav: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderColor: C.border, paddingBottom: 8 }, navItem: { flex: 1, alignItems: 'center', paddingVertical: 17 }, navText: { color: C.muted, fontWeight: '700' }, navActive: { color: C.green } });
