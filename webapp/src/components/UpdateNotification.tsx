import { useEffect, useState } from "react";

const UPDATE_CHECK_INTERVAL_MS = 60_000;

function refreshPageWithoutCache() {
  const refreshUrl = new URL(window.location.href);
  refreshUrl.searchParams.set("_refresh", Date.now().toString());
  window.location.replace(refreshUrl.toString());
}

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let disposed = false;
    let checkInProgress = false;

    const checkForUpdate = async () => {
      if (checkInProgress) return;
      checkInProgress = true;

      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}version.json?check=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(`Update check failed with status ${response.status}.`);
        }

        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("version" in payload) ||
          typeof payload.version !== "string"
        ) {
          throw new Error("Update check returned an invalid version.");
        }

        if (!disposed && payload.version !== __APP_VERSION__) {
          setUpdateAvailable(true);
        }
      } catch (error) {
        if (!disposed) console.error("Failed to check for an app update.", error);
      } finally {
        checkInProgress = false;
      }
    };

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    const intervalId = window.setInterval(
      () => void checkForUpdate(),
      UPDATE_CHECK_INTERVAL_MS
    );

    void checkForUpdate();
    window.addEventListener("focus", checkWhenVisible);
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkWhenVisible);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="update-notice" role="status" aria-live="polite">
      <span>A new version is available.</span>
      <button type="button" onClick={refreshPageWithoutCache}>
        Refresh page
      </button>
    </div>
  );
}
