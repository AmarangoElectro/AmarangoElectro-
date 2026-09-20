export type SonicCue = "tap" | "navigate" | "filter" | "favorite" | "share" | "success" | "slide" | "compare" | "intent";

const STORAGE_KEY = "amarango:sonic-enabled";
const PREFERENCE_EVENT = "amarango:sonic-preference";

type WindowWithAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

let context: AudioContext | null = null;

export function isSonicEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "0";
}

export function setSonicEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT, { detail: { enabled } }));
}

export function subscribeSonicPreference(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(PREFERENCE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(PREFERENCE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function getContext() {
  if (context) return context;
  const AudioContextConstructor = window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  context = new AudioContextConstructor();
  return context;
}

function scheduleTone(
  audio: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  destinationFrequency?: number,
) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (destinationFrequency && destinationFrequency > 0) {
    oscillator.frequency.exponentialRampToValueAtTime(destinationFrequency, start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

function renderCue(audio: AudioContext, cue: SonicCue) {
  const now = audio.currentTime + 0.004;
  switch (cue) {
    case "tap":
      scheduleTone(audio, now, 690, 0.045, 0.016, "sine", 760);
      break;
    case "navigate":
      scheduleTone(audio, now, 470, 0.06, 0.014, "sine", 620);
      scheduleTone(audio, now + 0.018, 940, 0.05, 0.006, "sine", 1080);
      break;
    case "filter":
      scheduleTone(audio, now, 430, 0.05, 0.012, "triangle", 520);
      break;
    case "slide":
      scheduleTone(audio, now, 360, 0.065, 0.011, "sine", 470);
      break;
    case "favorite":
      scheduleTone(audio, now, 610, 0.07, 0.016, "sine", 670);
      scheduleTone(audio, now + 0.045, 815, 0.09, 0.012, "sine", 900);
      break;
    case "share":
      scheduleTone(audio, now, 720, 0.06, 0.012, "sine", 840);
      scheduleTone(audio, now + 0.038, 1010, 0.08, 0.009, "sine", 1140);
      break;
    case "compare":
      scheduleTone(audio, now, 392, 0.075, 0.012, "sine", 466);
      scheduleTone(audio, now + 0.04, 587.33, 0.09, 0.010, "sine", 659.25);
      break;
    case "intent":
      scheduleTone(audio, now, 440, 0.07, 0.012, "sine", 554.37);
      scheduleTone(audio, now + 0.035, 659.25, 0.095, 0.010, "sine", 739.99);
      break;
    case "success":
      scheduleTone(audio, now, 523.25, 0.075, 0.014, "sine", 560);
      scheduleTone(audio, now + 0.055, 659.25, 0.085, 0.013, "sine", 700);
      scheduleTone(audio, now + 0.11, 783.99, 0.11, 0.011, "sine", 830);
      break;
  }
}

/**
 * Plays a tiny interface cue only in response to user-driven actions.
 * The AudioContext is created lazily, so the storefront never autoplays sound.
 */
export function playSonicCue(cue: SonicCue) {
  if (typeof window === "undefined" || !isSonicEnabled() || document.visibilityState !== "visible") return;
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "running") {
    renderCue(audio, cue);
    return;
  }
  void audio.resume().then(() => {
    if (audio.state === "running") renderCue(audio, cue);
  }).catch(() => undefined);
}
