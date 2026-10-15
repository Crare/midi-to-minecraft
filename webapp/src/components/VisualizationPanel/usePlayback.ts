import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { VisualizationPlacement } from '../../types';
import {
  getAudioClock,
  playPlacementSoundSync,
  prepareAudioPlayback,
} from '../../audio/noteblockAudio';
import { findFirstNoteIndexAtOrAfter, redstoneTickDurationMs } from './visualizationData';
import type { PlayheadPositionOptions } from './useTimelineCanvas';

const START_DELAY_S = 0.06;
const SCHEDULE_AHEAD_S = 0.15;
const SCHEDULER_INTERVAL_MS = 25;
const STATE_SYNC_INTERVAL_MS = 120;

export type PlaybackNote = VisualizationPlacement & { startTick: number; trackId: string };

interface UsePlaybackArgs {
  notes: PlaybackNote[];
  endTick: number;
  mutedTracks: Set<string>;
  playheadTickRef: MutableRefObject<number>;
  setPlayheadPosition: (tick: number, options?: PlayheadPositionOptions) => void;
  setPlayheadTick: (tick: number) => void;
  drawNow: () => void;
}

/**
 * Plays the notes: they are booked a little ahead on the Web Audio clock so
 * main-thread stalls can't delay or bunch them, and the same clock drives the playhead.
 */
export function usePlayback({
  notes,
  endTick,
  mutedTracks,
  playheadTickRef,
  setPlayheadPosition,
  setPlayheadTick,
  drawNow,
}: UsePlaybackArgs) {
  const [isPlaying, setIsPlaying] = useState(false);

  const notesRef = useRef<PlaybackNote[]>([]);
  const endTickRef = useRef(0);
  const mutedTracksRef = useRef(mutedTracks);
  const cursorRef = useRef(0);
  const lastStateSyncMsRef = useRef(0);
  const animationFrameRef = useRef(0);
  const startMsRef = useRef(0);
  const schedulerRef = useRef(0);
  const startTickRef = useRef(0);

  useEffect(() => {
    notesRef.current = notes;
    endTickRef.current = endTick;
  }, [endTick, notes]);

  useEffect(() => {
    mutedTracksRef.current = mutedTracks;
  }, [mutedTracks]);

  const clearTimers = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    if (schedulerRef.current) {
      window.clearInterval(schedulerRef.current);
      schedulerRef.current = 0;
    }
  }, []);

  const stopPlayback = useCallback(
    (nextTick?: number) => {
      clearTimers();
      setIsPlaying(false);

      if (typeof nextTick === 'number') {
        setPlayheadPosition(nextTick, { syncState: true, syncScroll: true });
        return;
      }
      setPlayheadTick(playheadTickRef.current);
    },
    [clearTimers, setPlayheadPosition, setPlayheadTick, playheadTickRef]
  );

  const startPlayback = useCallback(
    async (startTick = playheadTickRef.current) => {
      if (notesRef.current.length === 0) return;

      const clampedStartTick = Math.min(Math.max(0, startTick), endTickRef.current + 1);

      stopPlayback(clampedStartTick);
      await prepareAudioPlayback();

      const audioNow = getAudioClock();
      const useAudioClock = audioNow !== null;
      const audioStart: number | null = useAudioClock ? audioNow + START_DELAY_S : null;
      startMsRef.current = performance.now() + START_DELAY_S * 1000;
      startTickRef.current = clampedStartTick;
      cursorRef.current = findFirstNoteIndexAtOrAfter(notesRef.current, clampedStartTick);
      lastStateSyncMsRef.current = 0;
      setIsPlaying(true);

      const tickDurationS = redstoneTickDurationMs / 1000;
      const elapsedSeconds = () =>
        useAudioClock
          ? (getAudioClock() ?? audioStart!) - audioStart!
          : (performance.now() - startMsRef.current) / 1000;

      const scheduleNotes = () => {
        const list = notesRef.current;
        const horizonTick =
          startTickRef.current + (elapsedSeconds() + SCHEDULE_AHEAD_S) / tickDurationS;
        while (
          cursorRef.current < list.length &&
          list[cursorRef.current].startTick <= horizonTick + 0.0001
        ) {
          const note = list[cursorRef.current];
          if (!mutedTracksRef.current.has(note.trackId)) {
            const when = useAudioClock
              ? audioStart! + (note.startTick - startTickRef.current) * tickDurationS
              : undefined;
            playPlacementSoundSync(note, when);
          }
          cursorRef.current += 1;
        }
      };

      const animationStep = () => {
        const finalTick = endTickRef.current + 1;
        const nextTick = Math.min(
          finalTick,
          startTickRef.current + Math.max(0, elapsedSeconds()) / tickDurationS
        );

        scheduleNotes();

        const now = performance.now();
        const shouldSyncState =
          now - lastStateSyncMsRef.current > STATE_SYNC_INTERVAL_MS || nextTick >= finalTick;

        setPlayheadPosition(nextTick, {
          syncState: shouldSyncState,
          syncScroll: true,
          draw: false,
        });
        drawNow();

        if (shouldSyncState) lastStateSyncMsRef.current = now;

        if (nextTick >= finalTick) {
          stopPlayback(finalTick);
          return;
        }

        animationFrameRef.current = window.requestAnimationFrame(animationStep);
      };

      scheduleNotes();
      schedulerRef.current = window.setInterval(scheduleNotes, SCHEDULER_INTERVAL_MS);
      animationFrameRef.current = window.requestAnimationFrame(animationStep);
    },
    [stopPlayback, setPlayheadPosition, drawNow, playheadTickRef]
  );

  // Changing which notes play invalidates the running schedule.
  useEffect(() => {
    if (isPlaying) stopPlayback();
    // Only a new note list should stop playback, not isPlaying itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  useEffect(() => clearTimers, [clearTimers]);

  return { isPlaying, startPlayback, stopPlayback };
}
