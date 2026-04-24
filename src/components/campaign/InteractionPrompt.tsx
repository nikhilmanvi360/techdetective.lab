interface InteractionPromptProps {
  visible: boolean;
}

export default function InteractionPrompt({ visible }: InteractionPromptProps) {
  if (!visible) return null;
  return (
    <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-2 bg-[#1d1208]/90 border border-[#d4a017]/60 px-4 py-2 shadow-lg">
        <div className="w-6 h-6 border-2 border-[#d4a017] flex items-center justify-center">
          <span className="text-[10px] font-black text-[#d4a017]">E</span>
        </div>
        <span className="text-[10px] font-black text-[#f0e0a0] uppercase tracking-widest">
          Inspect
        </span>
      </div>
    </div>
  );
}
