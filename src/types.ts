export interface Track {
  id: string; // Spotify track ID, e.g., '4PTG3Z6ehGkBF3zIqYQGS3'
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  previewUrl: string; // URL to the preview clip or fallback audio
  reason?: string; // Explain why this track matches their specific mood & target
  spotifyUrl: string; // Direct link to open in Spotify
}

export type MusicRegion = 'Indian' | 'Western' | 'K-pop' | 'Global Pop';

export type MoodEmotion = 'Happy' | 'Calm' | 'Motivated' | 'Heartbroken' | 'Focused' | 'Energetic' | 'Romantic';

export type EnergyLevel = 'Chill & Low' | 'Steady & Mid' | 'Vibrant & High';

export interface MoodPrefState {
  region: MusicRegion;
  genre: string;
  emotion: MoodEmotion;
  energy: EnergyLevel;
  customPrefs: string;
}

export interface SpotifyUser {
  id: string;
  displayName: string;
  imageUrl?: string;
  product?: string; // 'premium' vs 'free'
}
