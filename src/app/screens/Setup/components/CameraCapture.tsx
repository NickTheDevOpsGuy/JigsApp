/**
 * CameraCapture – getUserMedia for camera; capture frame as Blob.
 * Uses relaxed constraints for mobile compatibility. Falls back to file input with capture on failure.
 */
import { useRef, useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "./CameraCapture.module.css";

const MIN_SIZE = 200;

/** Try increasingly permissive constraints – strict resolution causes OverconstrainedError on iOS/mobile. */
async function getCameraStream(): Promise<MediaStream> {
  const attempts: (boolean | MediaTrackConstraints)[] = [
    { facingMode: "environment" },
    { facingMode: "user" },
    true,
  ];

  for (const video of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video === true ? true : video,
        audio: false,
      });
      return stream;
    } catch {
      continue;
    }
  }
  throw new Error(
    "Could not access camera. Please grant permission or use Upload instead.",
  );
}

type CameraCaptureProps = {
  onCapture: (blob: Blob) => Promise<boolean>;
  disabled?: boolean;
};

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading") return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await getCameraStream();

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("ready");
        setErrorMsg(null);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Could not access camera.";
        setErrorMsg(msg);
        setStatus("error");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [status]);

  useEffect(() => {
    if (status === "loading" || status === "ready") {
      return () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
    }
  }, [status]);

  const handleStart = () => setStatus("loading");

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ok = await onCapture(file);
    if (ok) setStatus("idle");
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState !== 4) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w < MIN_SIZE || h < MIN_SIZE) {
      setErrorMsg(
        `Camera image too small (${w}×${h}px). Need at least ${MIN_SIZE}×${MIN_SIZE}px, or use "Open Camera App" for better quality.`,
      );
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const ok = await onCapture(blob);
          if (ok) {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setStatus("idle");
          }
        }
      },
      "image/jpeg",
      0.92,
    );
  };

  if (status === "idle") {
    return (
      <div className={styles.placeholder}>
        <Camera size={48} className={styles.icon} />
        <p>Take a photo with your camera to use as your puzzle image.</p>
        <p className={styles.hint}>
          Requires HTTPS (or localhost) and camera permission.
        </p>
        <div className={styles.idleActions}>
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={disabled}
            title="Start camera"
          >
            <Camera size={18} />
            Start Camera
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileCapture}
            className={styles.fileInput}
            aria-label="Take photo with camera app"
            title="Take photo with camera app"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Open device camera app"
          >
            Open Camera App
          </Button>
        </div>
        <p className={styles.hint}>
          Use &quot;Open Camera App&quot; if live preview doesn&apos;t work on your
          device.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className={styles.placeholder}>
        <p>Requesting camera access...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.placeholder}>
        <p className={styles.error}>{errorMsg}</p>
        <p className={styles.hint}>
          On mobile, you can use the button below to open your camera app instead.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileCapture}
          className={styles.fileInput}
          aria-label="Take photo with camera"
          title="Take photo with camera"
        />
        <Button
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Open camera app"
        >
          <Camera size={18} />
          Open Camera App
        </Button>
        <Button variant="secondary" onClick={() => setStatus("idle")}>
          Try Live Preview Again
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.capture}>
      <div className={styles.previewWrap}>
        <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
      </div>
      {errorMsg && <p className={styles.error}>{errorMsg}</p>}
      <Button
        variant="primary"
        onClick={handleCapture}
        disabled={disabled}
        className={styles.captureBtn}
      >
        <Camera size={18} />
        Capture Photo
      </Button>
    </div>
  );
}
