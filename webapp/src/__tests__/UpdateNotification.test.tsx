// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UpdateNotification from "../components/UpdateNotification";

const APP_VERSION = "development";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: APP_VERSION }),
    })
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("UpdateNotification", () => {
  it("does not show a notice when the deployed version matches", async () => {
    render(<UpdateNotification />);

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(screen.queryByRole("status")).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/version\.json\?check=/),
      { cache: "no-store" }
    );
  });

  it("asks the user to refresh when a newer version is available", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ version: "new-deployment" }),
    } as Response);
    render(<UpdateNotification />);

    expect(await screen.findByText("A new version is available.")).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh page" })).toBeTruthy();
  });

  it("checks again when the page becomes visible", async () => {
    vi.useFakeTimers();
    render(<UpdateNotification />);
    await act(async () => {});

    expect(fetch).toHaveBeenCalledOnce();
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
