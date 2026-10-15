// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UploadPanel from "../components/UploadPanel";

afterEach(cleanup);

describe("UploadPanel", () => {
  it("converts the selected file with the current options", () => {
    const onFileSelected = vi.fn();
    const onConvertRequest = vi.fn();
    render(
      <UploadPanel
        busy={false}
        status="Choose a MIDI file to begin."
        onFileSelected={onFileSelected}
        onConvertRequest={onConvertRequest}
      />
    );

    fireEvent.change(screen.getByLabelText("output filename"), {
      target: { value: "song.json" },
    });
    fireEvent.click(
      screen.getByLabelText("Remove empty space at the start of the song")
    );
    const file = new File(["midi"], "song.mid", { type: "audio/midi" });
    fireEvent.change(screen.getByLabelText("MIDI file"), {
      target: { files: [file] },
    });

    expect(onFileSelected).toHaveBeenCalledWith("song.mid");
    expect(onConvertRequest).toHaveBeenCalledWith({
      file,
      outputName: "song.json",
      trimLeadingSilence: false,
    });
    expect(screen.queryByRole("button", { name: /convert/i })).toBeNull();
  });
});
