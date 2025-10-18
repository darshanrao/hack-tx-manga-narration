export interface TranscriptEntry {
  id: string;
  timestamp: number; // Time in seconds
  speaker: string;
  text: string;
  isActive?: boolean;
}

export function parseTranscript(transcriptContent: string): TranscriptEntry[] {
  const lines = transcriptContent.trim().split('\n');
  const entries: TranscriptEntry[] = [];
  
  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    // Parse timestamp and dialogue
    // Format: "00:00 Speaker: Dialogue text"
    const match = line.match(/^(\d{2}:\d{2})\s+(.+?):\s*(.+)$/);
    
    if (match) {
      const [, timeStr, speaker, text] = match;
      
      // Convert timestamp to seconds
      const [minutes, seconds] = timeStr.split(':').map(Number);
      const timestamp = minutes * 60 + seconds;
      
      entries.push({
        id: `entry-${index}`,
        timestamp,
        speaker: speaker.trim(),
        text: text.trim(),
        isActive: false
      });
    }
  });
  
  return entries;
}

export function findActiveTranscriptEntry(
  entries: TranscriptEntry[], 
  currentTime: number
): TranscriptEntry | null {
  // Find the entry that should be active based on current time
  // An entry is active if the current time is within its duration
  // For now, we'll use a simple approach where an entry is active
  // if the current time is >= its timestamp and < the next entry's timestamp
  
  if (entries.length === 0) return null;
  
  // If current time is before the first entry, return null
  if (currentTime < entries[0].timestamp) return null;
  
  for (let i = 0; i < entries.length; i++) {
    const currentEntry = entries[i];
    const nextEntry = entries[i + 1];
    
    // If this is the last entry, it's active if current time >= its timestamp
    if (!nextEntry) {
      if (currentTime >= currentEntry.timestamp) {
        return currentEntry;
      }
    } else {
      // Entry is active if current time is between its timestamp and the next entry's timestamp
      if (currentTime >= currentEntry.timestamp && currentTime < nextEntry.timestamp) {
        return currentEntry;
      }
    }
  }
  
  return null;
}

export function updateTranscriptEntries(
  entries: TranscriptEntry[], 
  currentTime: number
): TranscriptEntry[] {
  const activeEntry = findActiveTranscriptEntry(entries, currentTime);
  
  return entries.map(entry => ({
    ...entry,
    isActive: entry.id === activeEntry?.id
  }));
}
