import { useState, useRef, useCallback } from "react";

export default function useAudioContext() {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef(null);
  const audioQueueRef = useRef([]);
  const playbackTimeRef = useRef(null); // tracks cumulative schedule
  const [audioChunksCount, setAudioChunksCount] = useState(0);

  // -------------------------------
  // Init
  // -------------------------------
  const initAudioContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();

      if (audioCtxRef.current.state === "suspended") {
        try {
          await audioCtxRef.current.resume();
        } catch (err) {
          console.warn("Audio context requires user interaction:", err);
          return false;
        }
      }

      setIsAudioReady(true);
      return true;
    }
    return false;
  }, []);

  // -------------------------------
  // PCM16 → AudioBuffer
  // -------------------------------
  const pcm16ToAudioBuffer = useCallback((arrayBuffer) => {
    if (!audioCtxRef.current) return null;

    // Interpret as signed 16-bit little endian
    const pcm16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0; // normalize to [-1, 1]
    }

    const audioBuffer = audioCtxRef.current.createBuffer(
      1, // mono
      float32.length,
      22050 // must match backend sample_rate
    );
    audioBuffer.getChannelData(0).set(float32);
    return audioBuffer;
  }, []);

  // -------------------------------
  // Playback
  // -------------------------------
  const MIN_BUFFER_CHUNKS = 3; // wait until we have at least this many

  const playAudioChunk = useCallback(
    async (arrayBuffer, chunkIndex, isLastChunk) => {
      if (!audioCtxRef.current) return;

      try {
        if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }

        const audioBuffer = pcm16ToAudioBuffer(arrayBuffer);
        if (!audioBuffer) return;

        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtxRef.current.destination);

        // If this is the very first chunk → wait for some buffering
        if (playbackTimeRef.current === null) {
          audioQueueRef.current.push({ source, audioBuffer });
          setAudioChunksCount(audioQueueRef.current.length);
          if (
            audioQueueRef.current.length < MIN_BUFFER_CHUNKS &&
            !isLastChunk
          ) {
            return; // not enough buffered, don’t start yet
          }

          // Start playback timeline a bit in the future
          playbackTimeRef.current = audioCtxRef.current.currentTime + 0.05;
          setIsPlaying(true);

          // Play all buffered chunks now
          while (audioQueueRef.current.length > 0) {
            const { source: bufferedSource, audioBuffer: buf } =
              audioQueueRef.current.shift();
            bufferedSource.start(playbackTimeRef.current);
            playbackTimeRef.current += buf.duration;
          }
        } else {
          // Normal case: already playing
          const startTime = Math.max(
            playbackTimeRef.current,
            audioCtxRef.current.currentTime + 0.01
          );
          source.start(startTime);
          playbackTimeRef.current = startTime + audioBuffer.duration;
        }

        // cleanup
        source.onended = () => {
          if (isLastChunk && playbackTimeRef.current !== null) {
            playbackTimeRef.current = null;
            setIsPlaying(false);
            setAudioChunksCount(0);
          }
        };
      } catch (err) {
        console.error("Error playing audio chunk:", err);
      }
    },
    [pcm16ToAudioBuffer]
  );

  // -------------------------------
  // Stop
  // -------------------------------
  const clearAudioQueue = useCallback(() => {
    audioQueueRef.current.forEach(({ source }) => {
      try {
        source.stop();
      } catch {}
    });
    audioQueueRef.current = [];
    playbackTimeRef.current = null;
    setIsPlaying(false);
  }, []);

  return {
    isAudioReady,
    isPlaying,
    initAudioContext,
    playAudioChunk,
    clearAudioQueue,
    audioChunksCount,
  };
}
