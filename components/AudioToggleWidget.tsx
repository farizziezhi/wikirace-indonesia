"use client";

import { useEffect, useState } from "react";
import { isAudioMuted, toggleMuteAudio } from "@/lib/race-audio";

interface AudioToggleWidgetProps {
  dark?: boolean;
}

export default function AudioToggleWidget({ dark = false }: AudioToggleWidgetProps) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, []);

  function handleToggle() {
    const nextMute = toggleMuteAudio();
    setMuted(nextMute);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center justify-center chunky-press w-8.5 h-8.5 border-2 rounded-full cursor-pointer select-none transition-all ${
        dark
          ? "bg-charcoal-text text-warm-cream border-very-dark hover:text-lime-accent"
          : "bg-pure-white text-charcoal-text border-charcoal-text hover:bg-light-beige"
      }`}
      style={{
        boxShadow: "1.5px 1.5px 0px #000",
      }}
      title={muted ? "Unmute audio / Aktifkan suara" : "Mute audio / Bisukan suara"}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
    >
      <span style={{ fontSize: "14px" }}>
        {muted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}
