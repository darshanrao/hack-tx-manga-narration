import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  number: number;
}

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapterId: string | null;
  onChapterSelect: (id: string) => void;
  seriesTitle?: string;
}

export function ChapterList({
  chapters,
  selectedChapterId,
  onChapterSelect,
  seriesTitle,
}: ChapterListProps) {
  return (
    <div className="h-full flex flex-col border-r-4 border-border bg-background" role="navigation" aria-label="Chapter navigation">
      <div className="p-6 border-b-4 border-border">
        <h2>Chapters</h2>
        {seriesTitle && (
          <p className="text-muted-foreground mt-2">{seriesTitle}</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3" role="list" aria-label="Chapter list. Use up and down arrow keys to navigate chapters.">
          {chapters.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <FileText className="mx-auto h-16 w-16 mb-3 opacity-50" />
              <p>No chapters available</p>
              <p className="mt-2">
                Select a manga series
              </p>
            </div>
          ) : (
            chapters.map((chapter) => (
              <Button
                key={chapter.id}
                variant={selectedChapterId === chapter.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-2 h-auto py-4 px-4 focus:ring-4 focus:ring-primary/50 focus:outline-none"
                onClick={() => onChapterSelect(chapter.id)}
                aria-label={`Chapter ${chapter.number}: ${chapter.title}. ${selectedChapterId === chapter.id ? "Currently reading" : "Press Enter to start reading"}`}
                aria-current={selectedChapterId === chapter.id ? "true" : "false"}
                role="listitem"
              >
                <FileText className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div>
                    Chapter {chapter.number}
                  </div>
                  <div className="text-muted-foreground">
                    {chapter.title}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

