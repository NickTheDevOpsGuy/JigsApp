import { useRef, useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "./CameraCapture.module.css";

const MIN_SIZE = 200;

type CameraCaptureProps = {
  onCapture: (blob: Blob) => Promise<boolean>;
  disabled?: boolean;
};

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading") return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { min: 640 }, height: { min: 480 } },
          audio: false,
        });

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

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState !== 4) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w < MIN_SIZE || h < MIN_SIZE) {
      setErrorMsg(
        `Camera resolution too low (${w}×${h}). Need at least ${MIN_SIZE}×${MIN_SIZE}.`,
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
        <Button variant="primary" onClick={handleStart} disabled={disabled}>
          <Camera size={18} />
          Start Camera
        </Button>
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
        <Button variant="secondary" onClick={() => setStatus("idle")}>
          Try Again
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
