import { useState, useCallback } from 'react';

interface FileData {
  name: string;
  language: string;
  content: string;
}

export function useMissionFiles(initialFiles: FileData[]) {
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const updateActiveFileContent = useCallback((newContent: string) => {
    setFiles(prev => {
      const next = [...prev];
      next[activeFileIndex] = { ...next[activeFileIndex], content: newContent };
      return next;
    });
  }, [activeFileIndex]);

  const activeFile = files[activeFileIndex];

  return {
    files,
    activeFile,
    activeFileIndex,
    setActiveFileIndex,
    updateActiveFileContent,
    setFiles
  };
}
