// Centralized audio playback with caching and single-instance control

let currentAudio: HTMLAudioElement | null = null;
const audioCache = new Map<string, HTMLAudioElement>();

export function playAudio(url: string | null | undefined): Promise<void> {
  if (!url) return Promise.resolve();

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  let audio = audioCache.get(url);
  if (!audio) {
    audio = new Audio(url);
    audioCache.set(url, audio);
  } else {
    audio.currentTime = 0;
  }

  currentAudio = audio;
  return audio.play().catch(() => {});
}

export function preloadAudio(url: string | null | undefined): void {
  if (!url || audioCache.has(url)) return;
  const audio = new Audio(url);
  audio.preload = "auto";
  audioCache.set(url, audio);
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
