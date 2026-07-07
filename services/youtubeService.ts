import { QuizResult, VideoResult } from "../lib/types";

export type { VideoResult };

// Mock data used as a fallback if the API fails (e.g. offline dev)
const MOCK_VIDEOS: VideoResult[] = [
  {
    title: "[Mock video] 30-Minute Full Body Workout (No Equipment)",
    url: "https://www.youtube.com/watch?v=UoC_O3HzsH0",
    thumbnail: "https://i.ytimg.com/vi/UoC_O3HzsH0/hqdefault.jpg",
    duration: { timestamp: "30:00" },
    author: { name: "FitnessBlender" },
  },
  {
    title: "[Mock video] 45-Minute HIIT Workout - Full Body",
    url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
    thumbnail: "https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg",
    duration: { timestamp: "45:42" },
    author: { name: "SELF" },
  },
  {
    title: "[Mock video] 20-Minute Core Strength & Flexibility Flow",
    url: "https://www.youtube.com/watch?v=V1HbXt5ZRlg",
    thumbnail: "https://i.ytimg.com/vi/V1HbXt5ZRlg/hqdefault.jpg",
    duration: { timestamp: "20:13" },
    author: { name: "Yoga With Adriene" },
  },
  {
    title: "[Mock video] 15-Minute Morning Yoga Routine",
    url: "https://www.youtube.com/watch?v=V1HbXt5ZRlg",
    thumbnail: "https://i.ytimg.com/vi/V1HbXt5ZRlg/hqdefault.jpg",
    duration: { timestamp: "15:42" },
    author: { name: "Yoga With Adriene" },
  },
];

export const searchWorkoutVideos = async (
  filters: QuizResult
): Promise<VideoResult[]> => {
  try {
    const response = await fetch("/api/youtube-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.videos;
  } catch (error) {
    console.error("Error fetching workout videos:", error);
    return MOCK_VIDEOS;
  }
};
