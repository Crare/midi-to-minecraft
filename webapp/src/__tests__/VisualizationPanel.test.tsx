// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildTrackEvents } from "../utils";
import { buildSyntheticMidi } from "./helpers";

const audio = vi.hoisted(() => ({
  clock: 100,
  playSync: vi.fn(),
}));

vi.mock("../audio/noteblockAudio", () => ({
  getAudioClock: () => audio.clock,
  prepareAudioPlayback: () => Promise.resolve(),
  playPlacementSound: () => Promise.resolve(),
  playPlacementSoundSync: audio.playSync,
}));

import VisualizationPanel from "../components/VisualizationPanel";

const noopContext = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (prop === "measureText") return () => ({ width: 10 });
      if (prop === "createLinearGradient") return () => ({ addColorStop() {} });
      return () => undefined;
    },
    set: () => true,
  }
);

const CANVAS_WIDTH = 300;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  audio.clock = 100;
  audio.playSync.mockClear();
  HTMLCanvasElement.prototype.getContext = (() => noopContext) as never;
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => CANVAS_WIDTH,
  });
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  HTMLElement.prototype.setPointerCapture = () => {};
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const trackEvents = buildTrackEvents(buildSyntheticMidi());

function renderPanel() {
  return render(<VisualizationPanel trackEvents={trackEvents} />);
}

const slider = () => screen.getByRole("slider", { hidden: true });
const sliderValue = () => Number(slider().getAttribute("aria-valuenow"));
const sliderMax = () => Number(slider().getAttribute("aria-valuemax"));
const playhead = () => slider() as HTMLElement;

async function advance(seconds: number) {
  // Move the fake audio clock and fire timers in small steps like a browser.
  for (let i = 0; i < seconds * 40; i += 1) {
    audio.clock += 0.025;
    await act(async () => {
      vi.advanceTimersByTime(25);
    });
  }
}

describe("VisualizationPanel", () => {
  it("shows the track length in ticks and time", () => {
    renderPanel();
    const max = sliderMax();
    const seconds = max * 0.1;
    const minutes = Math.floor(seconds / 60);
    const rest = (seconds - minutes * 60).toFixed(1).padStart(4, "0");
    expect(
      screen.getByText(`Track length: ${Math.ceil(max)} ticks (${minutes}:${rest})`)
    ).toBeTruthy();
    expect(screen.getByText(/Position: 0\.0 ticks \(0:00\.0\)/)).toBeTruthy();
  });

  it("opens with one mute button per lane and a labelled canvas", () => {
    renderPanel();
    const canvas = screen.getByRole("img", { name: /Track visualization with 4 lane/ });
    expect(canvas.getAttribute("tabindex")).toBe("0");
    expect(screen.getAllByRole("button", { name: /^Mute / }).length).toBe(4);
  });

  it("slider keys move the play position", () => {
    renderPanel();
    const max = sliderMax();
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(sliderValue()).toBe(1);
    fireEvent.keyDown(slider(), { key: "ArrowRight", shiftKey: true });
    expect(sliderValue()).toBe(11);
    fireEvent.keyDown(slider(), { key: "ArrowLeft" });
    expect(sliderValue()).toBe(10);
    fireEvent.keyDown(slider(), { key: "End" });
    expect(sliderValue()).toBe(max);
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(sliderValue()).toBe(max);
    fireEvent.keyDown(slider(), { key: "Home" });
    expect(sliderValue()).toBe(0);
    fireEvent.keyDown(slider(), { key: "ArrowLeft" });
    expect(sliderValue()).toBe(0);
  });

  it("mute buttons toggle aria-pressed", () => {
    renderPanel();
    const [first] = screen.getAllByRole("button", { name: /^Mute / });
    fireEvent.click(first);
    const unmute = screen.getAllByRole("button", { name: /^Unmute / });
    expect(unmute.length).toBe(1);
    expect(unmute[0].getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(unmute[0]);
    expect(screen.queryAllByRole("button", { name: /^Unmute / }).length).toBe(0);
  });

  it("canvas keys pan the timeline (playhead moves left on screen)", () => {
    renderPanel();
    fireEvent.keyDown(slider(), { key: "End" });
    const canvas = screen.getByRole("img", { name: /Track visualization/ });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const before = parseFloat(playhead().style.left);
    fireEvent.keyDown(canvas, { key: "End" });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const afterEnd = parseFloat(playhead().style.left);
    expect(afterEnd).toBeLessThanOrEqual(before);
    fireEvent.keyDown(canvas, { key: "Home" });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const afterHome = parseFloat(playhead().style.left);
    expect(afterHome).toBeGreaterThan(afterEnd);
  });

  it("plays every note once, on the audio clock, then stops at the end", async () => {
    renderPanel();
    const play = screen.getByRole("button", { name: "Play" });
    const startClock = audio.clock;
    await act(async () => {
      fireEvent.click(play);
    });
    await advance(sliderMax() * 0.1 + 1);

    const calls = audio.playSync.mock.calls;
    const expectedNotes = trackEvents.reduce(
      (n, track) => n + track.events.length,
      0
    );
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.length).toBe(expectedNotes);

    // Every note is booked relative to one shared start time, never in the past.
    const whens = calls.map((c) => c[1] as number);
    const origin = Math.min(...whens);
    expect(origin).toBeGreaterThanOrEqual(startClock);
    expect(whens.every((w) => Number.isFinite(w))).toBe(true);
    expect(Math.max(...whens) - origin).toBeCloseTo(sliderMax() * 0.1, 0);

    expect(screen.getByRole("button", { name: "Play" }).hasAttribute("disabled")).toBe(false);
    expect(sliderValue()).toBeGreaterThan(0);
  });

  it("does not schedule notes of muted lanes", async () => {
    renderPanel();
    const mutes = screen.getAllByRole("button", { name: /^Mute / });
    mutes.forEach((b) => fireEvent.click(b));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
    });
    await advance(sliderMax() * 0.1 + 1);
    expect(audio.playSync).not.toHaveBeenCalled();
  });

  it("stop button halts playback and keeps the position", async () => {
    renderPanel();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
    });
    await advance(1);
    expect(screen.getByRole("button", { name: "Play" }).hasAttribute("disabled")).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    });
    const stopped = sliderValue();
    const callsAtStop = audio.playSync.mock.calls.length;
    await advance(1);
    expect(sliderValue()).toBe(stopped);
    expect(audio.playSync.mock.calls.length).toBe(callsAtStop);
    expect(stopped).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Go to start" }));
    });
    expect(sliderValue()).toBe(0);
  });
});
