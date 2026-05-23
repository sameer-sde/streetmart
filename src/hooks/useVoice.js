import { LANGUAGES } from "../data/languages.js";

export function speak(text, langCode = "en") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // Strip emojis and special symbols before speaking
  const clean = text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .replace(/[🔊🟢🔴📍🕐⭐💬👥🏆📦💳🗺️🛒📱🤖❤️🤍☀️🌙🎤🔴●]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const lang = LANGUAGES.find(l => l.code === langCode);
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang?.voiceCode || "en-IN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));
  if (match) utterance.voice = match;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

export function startVoiceRecognition(lang = "en", onResult, onEnd) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { onEnd?.(); return null; }
  const recognition = new SpeechRecognition();
  const langObj = LANGUAGES.find(l => l.code === lang);
  recognition.lang = langObj?.voiceCode || "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (e) => { onResult?.(e.results[0][0].transcript); };
  recognition.onend = () => { onEnd?.(); };
  recognition.onerror = () => { onEnd?.(); };
  recognition.start();
  return recognition;
}

export function detectLanguage() {
  const browserLang = navigator.language || "en";
  const code = browserLang.slice(0, 2);
  const supported = ["en","hi","te","ta","kn","ml","mr","bn","gu","pa"];
  return supported.includes(code) ? code : "en";
}
