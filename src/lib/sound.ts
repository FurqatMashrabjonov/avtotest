let ctx: AudioContext | null = null;
const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)();
  return ctx;
};

function tone(freq: number, type: OscillatorType, duration: number, volume = 0.25) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch {}
}

export function playCorrect() {
  tone(523, "sine", 0.12, 0.2); // C5
  setTimeout(() => tone(659, "sine", 0.2, 0.2), 90); // E5
}

export function playWrong() {
  tone(220, "sawtooth", 0.08, 0.15);
  setTimeout(() => tone(180, "sawtooth", 0.16, 0.15), 70);
}
