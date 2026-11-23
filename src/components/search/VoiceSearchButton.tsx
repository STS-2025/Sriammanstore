import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SpeechRecognitionResult = { transcript: string };
type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

interface VoiceSearchButtonProps {
  language: "en" | "ta";
  onTranscript: (transcript: string) => void;
}

export function VoiceSearchButton({ language, onTranscript }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const toggleListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("Voice search is not supported by this browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language === "ta" ? "ta-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast.error("Allow microphone access to use voice search.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Voice search could not start. Please try again.");
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      toast.error("Voice search could not start. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      aria-label={isListening ? "Stop voice search" : "Start voice search"}
      aria-pressed={isListening}
      title={isListening ? "Stop voice search" : "Search by voice"}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
        isListening ? "bg-rose-100 text-rose-700" : "text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">
        {isListening ? "graphic_eq" : "mic"}
      </span>
    </button>
  );
}
