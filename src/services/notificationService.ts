import { PushNotification } from '../types';

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

/**
 * Requests native browser push notification permission.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'default';
  }
}

/**
 * Sends an instant push notification via browser Notification API.
 */
export function triggerSystemPush(title: string, body: string, onClickUrl?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
        tag: 'leave-notification',
      });
      if (onClickUrl) {
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    } catch (e) {
      console.debug('System notification error:', e);
    }
  }
}

// Cross-tab broadcast channel for instant multi-user simulation
const channelName = 'leave_notifications_bus';
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(channelName);
  }
} catch {
  broadcastChannel = null;
}

export function broadcastPushNotification(notification: PushNotification) {
  playNotificationChime();
  triggerSystemPush(notification.title, notification.message);

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(notification);
    } catch (err) {
      console.debug('Broadcast postMessage failed:', err);
    }
  }

  // Fallback via localStorage event for across tabs
  try {
    localStorage.setItem('leave_latest_push', JSON.stringify({ ...notification, _nonce: Date.now() }));
  } catch {
    // ignore
  }
}

export function subscribeToPushNotifications(callback: (notification: PushNotification) => void) {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.id) {
      callback(event.data as PushNotification);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handler);
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key === 'leave_latest_push' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed as PushNotification);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handler);
    }
    window.removeEventListener('storage', storageHandler);
  };
}
