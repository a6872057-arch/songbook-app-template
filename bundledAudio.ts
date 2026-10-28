// Keys are stable song IDs from catalog.json, not the displayed song number.
export const bundledAudio: Record<string, number> = {
  'sample-001': require('./assets/demo-tone.wav'),
};

export const bundledAudioDescriptions: Record<string, string> = {
  'sample-001': '這段短音效用來確認播放功能，並非詩歌錄音。',
};
