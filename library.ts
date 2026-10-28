export type Song = {
  id: string;
  number: string;
  title: string;
  category: string;
  lyrics: string[];
  audioUrl?: string;
  musicInfo?: string;
  sourceNotes?: string;
  sourcePage?: number;
};

// Keep personal lyrics/audio while refreshing the bundled catalog's metadata.
// Renumber imported songs only when their number collides with the new catalog.
export function mergeLibrary(saved: Song[], builtIn: Song[]): Song[] {
  const savedById = new Map(saved.map(song => [song.id, song]));
  const builtInIds = new Set(builtIn.map(song => song.id));
  const merged = builtIn.map(song => {
    const previous = savedById.get(song.id);
    return previous ? {
      ...song,
      lyrics: previous.lyrics,
      ...(previous.audioUrl !== undefined ? { audioUrl: previous.audioUrl } : {}),
    } : song;
  });
  const usedNumbers = new Set(merged.map(song => song.number));
  const usedIds = new Set(builtInIds);
  let nextNumber = Math.max(0, ...builtIn.map(song => Number(song.number)).filter(Number.isFinite)) + 1;
  for (const song of saved) {
    if (usedIds.has(song.id)) continue;
    const value = Number(song.number);
    let number = Number.isInteger(value) && value > 0 ? String(value).padStart(3, '0') : '';
    if (!number || usedNumbers.has(number)) {
      while (usedNumbers.has(String(nextNumber).padStart(3, '0'))) nextNumber++;
      number = String(nextNumber++).padStart(3, '0');
    }
    usedNumbers.add(number);
    usedIds.add(song.id);
    merged.push({ ...song, number });
  }
  return merged;
}
