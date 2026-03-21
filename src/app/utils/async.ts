/**
 * Small async helpers for yielding to the browser and converting canvas output
 * without forcing synchronous data URL work on the main thread.
 */

export function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    window.setTimeout(resolve, 0);
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

export async function canvasToObjectUrl(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
): Promise<string | null> {
  const blob = await canvasToBlob(canvas, type, quality);
  return blob ? URL.createObjectURL(blob) : null;
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  URL.revokeObjectURL(url);
}

export function revokeObjectUrls(urls: Iterable<string>): void {
  for (const url of urls) {
    revokeObjectUrl(url);
  }
}
