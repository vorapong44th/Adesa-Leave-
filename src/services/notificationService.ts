import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { app } from './firebaseAuth';
import { registerPushToken } from './leaveService';
let deviceToken: string | null = null;
let audioCtx: AudioContext | null = null;

/**
 * Plays a pleasant modern two-tone notification chime using Web Audio API.
 * No external audio file or asset download required.
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Tone 1 (Warm higher pitch)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tone 2 (Harmonic high resolution)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.debug('Audio chime unable to play:', err);
  }
}


export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!await isSupported()) throw new Error('This browser does not support device notifications. In-app updates remain available.');
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error('Device push is not configured yet. In-app updates remain available.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Allow notifications in your browser settings to receive device alerts.');
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;
  deviceToken = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
  if (!deviceToken) throw new Error('Unable to register this device. Please try again.');
  await registerPushToken(deviceToken);
  return permission;
}
export async function disablePushNotifications() {
  if (!await isSupported()) return;
  // Deleting the FCM subscription also invalidates tokens left after a page refresh.
  if (deviceToken) await registerPushToken(deviceToken, true).catch(() => {});
  await deleteToken(getMessaging(app));
  deviceToken = null;
}
