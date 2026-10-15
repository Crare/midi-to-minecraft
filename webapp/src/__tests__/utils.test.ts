import { describe, expect, it } from "vitest";
import {
  getOutputPrefix,
  getZipFilename,
  midiToMinecraftNote,
  midiToPitchClass,
  sanitizeFilename,
  splitOutputTarget,
} from "../utils";
import { blockByPatchId, instrumentByBlock } from "../constants";

describe("pitch helpers", () => {
  it("maps MIDI numbers to pitch classes", () => {
    expect(midiToPitchClass(60)).toBe("C");
    expect(midiToPitchClass(61)).toBe("C#");
    expect(midiToPitchClass(71)).toBe("B");
    expect(midiToPitchClass(0)).toBe("C");
  });

  it("maps MIDI numbers onto the 24-step noteblock range", () => {
    expect(midiToMinecraftNote(6)).toBe(0);
    expect(midiToMinecraftNote(30)).toBe(0);
    expect(midiToMinecraftNote(60)).toBe(6);
    expect(midiToMinecraftNote(0)).toBe(18);
    for (let n = 0; n < 128; n++) {
      const v = midiToMinecraftNote(n);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(24);
    }
  });
});

describe("file names", () => {
  it("sanitizes unsafe characters", () => {
    expect(sanitizeFilename("a b/c?.mid")).toBe("a_b_c_.mid");
  });

  it.each([
    ["song.mid", "", { dir: "output", stem: "song", ext: ".json" }],
    ["song.mid", "out.json", { dir: "output", stem: "out", ext: ".json" }],
    ["song.mid", "dir/name.txt", { dir: "dir", stem: "name", ext: ".txt" }],
    ["my song.mid", undefined, { dir: "output", stem: "my_song", ext: ".json" }],
    ["song.mid", "noext", { dir: "output", stem: "noext", ext: ".json" }],
  ])("splitOutputTarget(%s, %s)", (input, output, expected) => {
    expect(splitOutputTarget(input, output)).toEqual(expected);
  });

  it("builds the zip filename from the output stem", () => {
    expect(getZipFilename("dir/name.json", "song.mid")).toBe("name-json.zip");
    expect(getZipFilename("", "song.mid")).toBe("song-json.zip");
  });

  it("uses a safe filename stem as the shared export prefix", () => {
    expect(getOutputPrefix("dir/my song.json")).toBe("my_song");
    expect(getOutputPrefix("output")).toBe("output");
    expect(getOutputPrefix("")).toBe("output");
  });
});

describe("instrument mapping", () => {
  it("every patch maps to a block that has a known instrument", () => {
    Object.values(blockByPatchId).forEach((block) => {
      expect(instrumentByBlock[block], block).toBeTruthy();
    });
  });
});
