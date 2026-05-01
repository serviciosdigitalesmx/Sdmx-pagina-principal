"use client";

export async function clearClientState() {
  try {
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore cache errors
  }

  try {
    if ("indexedDB" in window && typeof indexedDB.databases === "function") {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases
          .filter((database) => Boolean(database.name))
          .map(
            (database) =>
              new Promise<void>((resolve) => {
                const request = indexedDB.deleteDatabase(database.name as string);
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
                request.onblocked = () => resolve();
              })
          )
      );
    }
  } catch {
    // ignore indexedDB errors
  }
}
