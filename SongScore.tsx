import { useState } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SCORE_ASPECT_RATIO, scoreSources } from './scoreSources';

export function SongScore({ songId, title }: { songId: string; title: string }) {
  const window = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [previewWidth, setPreviewWidth] = useState(Math.max(1, window.width - 40));
  const [viewport, setViewport] = useState({ width: window.width, height: window.height / 2 });
  const source = scoreSources[songId];
  const imageWidth = Math.max(1, viewport.width * zoom);
  if (!source) return null;

  return <View onLayout={event => setPreviewWidth(event.nativeEvent.layout.width)}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`放大${title}完整樂譜`} onPress={() => { setZoom(1); setExpanded(true); }}>
      <Image source={source} resizeMode="contain" style={{ width: previewWidth, height: previewWidth / SCORE_ASPECT_RATIO, backgroundColor: '#fff' }} accessibilityLabel={`${title}完整樂譜及原頁文字`} />
      <Text style={styles.open}>點擊樂譜放大閱讀</Text>
    </TouchableOpacity>
    <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.heading}>
          <TouchableOpacity accessibilityRole="button" onPress={() => setExpanded(false)} style={styles.button}><Text style={styles.buttonText}>關閉</Text></TouchableOpacity>
          <Text numberOfLines={2} style={styles.title}>{title}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="縮小樂譜" disabled={zoom <= 1} style={[styles.button, zoom <= 1 && styles.disabled]} onPress={() => setZoom(value => Math.max(1, value - 0.5))}><Text style={styles.buttonText}>縮小 −</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="重設樂譜大小" style={styles.button} onPress={() => setZoom(1)}><Text style={styles.buttonText}>{Math.round(zoom * 100)}%</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="放大樂譜" disabled={zoom >= 4} style={[styles.button, zoom >= 4 && styles.disabled]} onPress={() => setZoom(value => Math.min(4, value + 0.5))}><Text style={styles.buttonText}>放大 ＋</Text></TouchableOpacity>
        </View>
        <Text style={styles.hint}>放大後可左右及上下滑動閱讀</Text>
        <View style={styles.viewport} onLayout={event => setViewport({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
          <ScrollView horizontal style={styles.viewport} contentContainerStyle={{ height: viewport.height }}>
            <ScrollView nestedScrollEnabled style={{ width: imageWidth, height: viewport.height }}>
              <Image source={source} resizeMode="contain" style={{ width: imageWidth, height: imageWidth / SCORE_ASPECT_RATIO, backgroundColor: '#fff' }} accessibilityLabel={`${title}完整樂譜及原頁文字`} />
            </ScrollView>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: '#f7f4ec' },
  viewport: { flex: 1 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  title: { flex: 1, fontSize: 19, fontWeight: '700', color: '#273a34' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 8 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e6efe7', minHeight: 44 },
  buttonText: { color: '#2f6554', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.4 },
  hint: { textAlign: 'center', padding: 10, color: '#708077', fontSize: 13 },
  open: { textAlign: 'center', padding: 16, color: '#2f6554', fontWeight: '700', backgroundColor: '#e6efe7', fontSize: 16 },
});
