import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Vibration, Platform } from 'react-native';

/**
 * Hook to play ringing sound during call (similar to Facebook)
 * Plays sound when call status is 'ringing' or 'calling'
 * Uses vibration pattern to simulate phone ringing
 */
export const useRingingSound = (
  callStatus: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'
) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Play ringing sound when call is ringing or calling
    if (callStatus === 'ringing' || callStatus === 'calling') {
      if (!isPlayingRef.current) {
        playRingingSound();
      }
    } else {
      stopRingingSound();
    }

    // Cleanup on unmount
    return () => {
      stopRingingSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus]);

  const playRingingSound = async () => {
    // Don't play if already playing
    if (isPlayingRef.current) {
      return;
    }

    try {
      // Request audio mode for calls
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      isPlayingRef.current = true;
      
      // Phone ring pattern: Two short vibrations, pause, repeat
      // Pattern: vibrate-200ms, pause-100ms, vibrate-200ms, pause-1700ms (total 2 seconds)
      const ringPattern = Platform.OS === 'ios' 
        ? [0, 200, 100, 200] // iOS pattern
        : [0, 200, 100, 200, 1400]; // Android pattern (with longer pause)
      
      // Start vibration pattern (repeats automatically on iOS, manual on Android)
      if (Platform.OS === 'ios') {
        // iOS: Use repeat pattern
        Vibration.vibrate(ringPattern, true);
      } else {
        // Android: Manual repeat with interval
        const playVibration = () => {
          if (isPlayingRef.current) {
            Vibration.vibrate(ringPattern, false);
          }
        };
        
        // Play immediately
        playVibration();
        
        // Repeat every 2 seconds (ring pattern duration)
        vibrationIntervalRef.current = setInterval(() => {
          if (isPlayingRef.current) {
            playVibration();
          }
        }, 2000);
      }

      // Create audio tone using expo-av
      // Since we don't have a ringtone file, we'll create a simple beep pattern
      // For production, add a ringtone.mp3 file to assets and load it here
      try {
        // Create a simple audio pattern
        // This is a fallback - ideally you'd load an actual ringtone file
        await createRingingTone();
      } catch (audioError) {
        console.log('Audio tone creation failed, using vibration only:', audioError);
        // Continue with vibration only
      }
      
      console.log('🔔 Ringing sound/vibration started');
      
    } catch (error) {
      console.error('Error playing ringing sound:', error);
      isPlayingRef.current = false;
      
      // Fallback to vibration only
      try {
        const fallbackPattern = Platform.OS === 'ios' 
          ? [0, 400, 200, 400] 
          : [0, 400, 200, 400, 1000];
        Vibration.vibrate(fallbackPattern, Platform.OS === 'ios');
      } catch (vibError) {
        console.error('Error with vibration fallback:', vibError);
      }
    }
  };

  // Create a simple ringing tone using expo-av
  // In production, replace this with loading an actual ringtone file
  const createRingingTone = async () => {
    try {
      // For now, we'll use a programmatic approach
      // In production, you should:
      // 1. Add a ringtone.mp3 file to assets/sounds/
      // 2. Load it like this:
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../assets/sounds/ringtone.mp3'),
      //   { shouldPlay: true, isLooping: true, volume: 0.8 }
      // );
      // soundRef.current = sound;
      
      // For now, we'll just use vibration
      // The vibration pattern above provides the ringing effect
      console.log('Audio tone would play here (add ringtone file for production)');
    } catch (error) {
      console.error('Error creating ringing tone:', error);
      throw error;
    }
  };

  const stopRingingSound = async () => {
    if (!isPlayingRef.current) {
      return;
    }

    try {
      // Stop vibration
      Vibration.cancel();
      
      // Clear intervals
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
        vibrationIntervalRef.current = null;
      }
      
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }

      // Stop audio if playing
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (audioError) {
          console.error('Error stopping audio:', audioError);
        }
        soundRef.current = null;
      }
      
      isPlayingRef.current = false;
      console.log('🔇 Ringing sound/vibration stopped');
    } catch (error) {
      console.error('Error stopping ringing sound:', error);
      isPlayingRef.current = false;
    }
  };

  return {
    playRingingSound,
    stopRingingSound,
    isPlaying: isPlayingRef.current,
  };
};
