import type { ImageSourcePropType } from 'react-native';

// Add your own licensed PNG/JPG with a literal require(), keyed by song ID.
// Example after adding the file:
// 'sample-001': require('./assets/scores/my-score.png'),
export const scoreSources: Record<string, ImageSourcePropType> = {};

// All bundled score images should use this width / height ratio.
export const SCORE_ASPECT_RATIO = 210 / 297;
