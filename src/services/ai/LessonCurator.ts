import { VideoLesson } from "@sonic-core/creative/guitar/types";

export class LessonCurator {
  private apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  async findLessons(query: string, instrument: string): Promise<VideoLesson[]> {
    if (!this.apiKey) {
        console.error("YouTube API Key is missing.");
        return [];
    }

    try {
      const searchTerms = encodeURIComponent(`how to play ${query} on ${instrument} lesson tutorial`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchTerms}&type=video&videoEmbeddable=true&maxResults=9&key=${this.apiKey}`;
      
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      
      if (!data.items) return [];
  
      const decodeEntities = (str: string) => {
        // Simple entity decoder if DOM is available
        if (typeof document !== 'undefined') {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = str;
            return textarea.value;
        }
        return str;
      };
  
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: decodeEntities(item.snippet.title),
        channel: decodeEntities(item.snippet.channelTitle),
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails.high.url
      }));
  
    } catch (error) {
      console.error("Video Search Exception:", error);
      return [];
    }
  }
}
