// Records a voice note on the phone (AAC .m4a) or in the browser (WebM) and hands it over as a data URL for the API,
// which converts it and sends it to Muse Voice Transcribe.
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useState } from 'react';

import { toDataUrl } from '@/components/camera';

export function useVoiceNote() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 200);
  const [denied, setDenied] = useState(false);

  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) { setDenied(true); return false; }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    return true;
  };

  /** Stops and returns the note, or null when nothing usable was recorded. */
  const stop = async (): Promise<{ audio: string; uri: string; seconds: number } | null> => {
    const seconds = (state.durationMillis ?? 0) / 1000;
    await recorder.stop();
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    const uri = recorder.uri;
    if (!uri || seconds < 0.6) return null;
    return { audio: await toDataUrl(uri), uri, seconds };
  };

  return { start, stop, recording: state.isRecording, seconds: Math.round((state.durationMillis ?? 0) / 1000), denied };
}
