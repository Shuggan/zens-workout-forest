// Shared types for the workout search + forest log

// The filter values that drive the YouTube search query.
// Same shape/values as the original quiz so the search logic is unchanged.
export interface QuizResult {
  intensity: string;
  duration: string; // 'short' | 'medium' | 'long' | 'very-long'
  equipment: string; // 'none' | 'light' | 'gym' | 'mat'
  focusArea: string; // 'full-body' | 'upper' | 'lower' | 'core'
  mood: string; // 'hiit' | 'strength' | 'flexibility' | 'yoga'
}

export interface VideoResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: {
    timestamp: string;
  };
  author: {
    name: string;
  };
}

// A completed workout, persisted to localStorage.
export interface LoggedWorkout {
  id: string;
  title: string;
  minutes: number;
  completedAt: number; // epoch ms
  url?: string;
  thumbnail?: string;
  channel?: string;
}
