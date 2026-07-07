declare module 'youtube-search-api' {
  interface VideoItem {
    id: string;
    type: string;
    title: string;
    channelTitle: string;
    thumbnail: {
      thumbnails: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    };
    length?: {
      simpleText: string;
    };
    isLive?: boolean;
  }

  interface SearchResult {
    items: VideoItem[];
    nextPage: {
      nextPageToken: string;
      nextPageContext: any;
    };
  }

  interface PlaylistResult {
    items: any[];
    metadata: any;
  }

  interface VideoDetails {
    id: string;
    title: string;
    thumbnail: any[];
    isLive: boolean;
    channel: string;
    channelId: string;
    description: string;
    keywords: string[];
    suggestion: any[];
  }

  interface ShortVideo {
    id: string;
    type: string;
    thumbnail: {
      url: string;
      width: number;
      height: number;
    };
    title: string;
    inlinePlaybackEndpoint?: any;
  }

  export function GetListByKeyword(
    keyword: string,
    playlist?: boolean,
    limit?: number,
    options?: Array<{type: string}>
  ): Promise<SearchResult>;

  export function NextPage(
    nextPage: any,
    playlist?: boolean,
    limit?: number
  ): Promise<SearchResult>;

  export function GetPlaylistData(
    playlistId: string,
    limit?: number
  ): Promise<PlaylistResult>;

  export function GetSuggestData(limit?: number): Promise<{items: any[]}>;

  export function GetChannelById(channelId: string): Promise<any[]>;

  export function GetVideoDetails(videoId: string): Promise<VideoDetails>;

  export function GetShortVideo(): Promise<ShortVideo[]>;
} 