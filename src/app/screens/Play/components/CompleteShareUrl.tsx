/**
 * Puzzle URL shown in the completion overlay share section (not inside the Share Result modal).
 */
import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";

const PHUZZLE_URL = "https://phuzzle.vercel.app/";

export function CompleteShareUrl() {
  const [copied, setCopied] = useState(false);
  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PHUZZLE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  }, []);

  return (
    <div className={styles.completeShareUrl}>
      <a
        href={PHUZZLE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.completeShareUrlLink}
      >
        {PHUZZLE_URL}
      </a>
      <Button
        variant="secondary"
        size="sm"
        onClick={copyUrl}
        className={styles.completeShareUrlCopy}
        aria-label={copied ? "Copied" : "Copy URL"}
        title={copied ? "Copied!" : "Copy URL"}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </div>
  );
}
