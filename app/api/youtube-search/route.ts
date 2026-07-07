import { NextResponse } from 'next/server';
import youtubesearchapi from 'youtube-search-api';
import { QuizResult } from '../../../lib/types';

const generateSearchQuery = (quizResult: QuizResult): string => {
  const { intensity, duration, equipment, focusArea, mood } = quizResult;
  
  let durationTerm = '';
  if (duration === 'short') durationTerm = '15 minute';
  else if (duration === 'medium') durationTerm = '30 minute';
  else if (duration === 'long') durationTerm = '45 minute';
  else if (duration === 'very-long') durationTerm = '60 minute';
  
  let intensityTerm = '';
  if (mood === 'hiit') intensityTerm = 'high intensity';
  else if (mood === 'strength') intensityTerm = 'strength training';
  else if (mood === 'flexibility') intensityTerm = 'flexibility';
  else if (mood === 'yoga') intensityTerm = 'yoga';
  
  let equipmentTerm = '';
  if (equipment === 'none') equipmentTerm = 'bodyweight';
  else if (equipment === 'light') equipmentTerm = 'dumbbell';
  else if (equipment === 'gym') equipmentTerm = 'gym';
  else if (equipment === 'mat') equipmentTerm = 'yoga mat';
  
  let focusTerm = '';
  if (focusArea === 'full-body') focusTerm = 'full body';
  else if (focusArea === 'upper') focusTerm = 'upper body';
  else if (focusArea === 'lower') focusTerm = 'lower body';
  else if (focusArea === 'core') focusTerm = 'core abs';
  
  // Add longer duration term to avoid shorts
  return `${durationTerm} ${intensityTerm} ${focusTerm} ${equipmentTerm} workout`.trim();
};

export async function POST(request: Request) {
  try {
    const quizResult = await request.json() as QuizResult;
    const searchQuery = generateSearchQuery(quizResult);
    
    console.log('Searching YouTube for:', searchQuery);
    
    // Using youtube-search-api instead of yt-search
    const result = await youtubesearchapi.GetListByKeyword(searchQuery, false, 20, [{type: 'video'}]);
    
    // Filter to only include videos (not playlists or channels)
    // and limit to top results, ignoring shorts (less than 5 minutes)
    const videos = result.items
      .filter((video: any) => {
        // Check if video has length info and is longer than 5 minutes
        if (!video.length || !video.length.simpleText) return false;
        
        const durationText = video.length.simpleText;
        // Parse the timestamp to get minutes (handles both "X:YY" and "X:YY:ZZ" formats)
        const parts = durationText.split(':');
        
        // If format is HH:MM:SS
        if (parts.length === 3) {
          return true; // Definitely longer than 5 minutes
        }
        
        // If format is MM:SS
        if (parts.length === 2) {
          const minutes = parseInt(parts[0], 10);
          return minutes >= 5;
        }
        
        return false;
      })
      .slice(0, 9) // Get up to 9 videos for pagination (3 pages of 3)
      .map((video: any) => ({
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnail?.thumbnails?.[0]?.url || '',
        duration: {
          timestamp: video.length?.simpleText || ''
        },
        author: {
          name: video.channelTitle || ''
        }
      }));
    
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return NextResponse.json({ videos: [] }, { status: 500 });
  }
} 