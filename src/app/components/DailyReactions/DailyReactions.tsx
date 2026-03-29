/**
 * DailyReactions – emoji reactions and lightweight comments on daily puzzle.
 * Shown after completion; 280 char limit; report support.
 */
import { useEffect, useState, useCallback } from "react";
import { Flag } from "lucide-react";
import {
  fetchDailyComments,
  fetchDailyReactions,
  postComment,
  toggleReaction,
  reportComment,
  getReactionEmojis,
  type DailyComment,
  type DailyReactionCount,
} from "@/services/player/dailyCommentsService";
import { isSupabaseConfigured } from "@/supabase/client";
import styles from "./DailyReactions.module.css";

const MAX_COMMENT_LENGTH = 280;

interface DailyReactionsProps {
  puzzleDate: string;
}

export function DailyReactions({ puzzleDate }: DailyReactionsProps) {
  const [comments, setComments] = useState<DailyComment[]>([]);
  const [reactions, setReactions] = useState<DailyReactionCount[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const [c, r] = await Promise.all([
      fetchDailyComments(puzzleDate),
      fetchDailyReactions(puzzleDate),
    ]);
    setComments(c);
    setReactions(
      r.length > 0
        ? r
        : getReactionEmojis().map((e) => ({ emoji: e, count: 0, userReacted: false })),
    );
    setLoading(false);
  }, [puzzleDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReaction = useCallback(
    async (emoji: string) => {
      if (!isSupabaseConfigured() || posting) return;
      setPosting(true);
      const ok = await toggleReaction(puzzleDate, emoji);
      setPosting(false);
      if (ok) load();
    },
    [puzzleDate, posting, load],
  );

  const handlePostComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !isSupabaseConfigured() || posting) return;
    setPosting(true);
    const ok = await postComment(puzzleDate, trimmed);
    setPosting(false);
    if (ok) {
      setCommentText("");
      load();
    }
  }, [puzzleDate, commentText, posting, load]);

  const handleReport = useCallback(
    async (commentId: string) => {
      if (!isSupabaseConfigured() || reportingId) return;
      setReportingId(commentId);
      const ok = await reportComment(commentId);
      setReportingId(null);
      if (ok) load();
    },
    [reportingId, load],
  );

  if (!isSupabaseConfigured()) return null;
  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.reactions}>
        <span className={styles.label}>React:</span>
        {reactions.map((r) => (
          <button
            key={r.emoji}
            type="button"
            className={`${styles.emojiBtn} ${r.userReacted ? styles.emojiBtnActive : ""}`}
            onClick={() => handleReaction(r.emoji)}
            disabled={posting}
            aria-pressed={r.userReacted}
            aria-label={`React with ${r.emoji}, ${r.count} reactions`}
            title={`React with ${r.emoji} (${r.count})`}
          >
            <span className={styles.emoji}>{r.emoji}</span>
            {r.count > 0 && <span className={styles.count}>{r.count}</span>}
          </button>
        ))}
      </div>
      <div className={styles.comments}>
        <h4 className={styles.commentsTitle}>Comments</h4>
        <div className={styles.commentInput}>
          <textarea
            placeholder="Share a thought… (280 chars)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            className={styles.textarea}
            disabled={posting}
            aria-label="Daily puzzle comment"
          />
          <div className={styles.commentActions}>
            <span
              className={
                commentText.length >= MAX_COMMENT_LENGTH
                  ? styles.charCountAtLimit
                  : commentText.length >= MAX_COMMENT_LENGTH - 30
                    ? styles.charCountNearLimit
                    : styles.charCount
              }
              aria-live="polite"
              aria-label={`${commentText.length} of ${MAX_COMMENT_LENGTH} characters`}
            >
              {commentText.length}/{MAX_COMMENT_LENGTH}
            </span>
            <button
              type="button"
              className={styles.postBtn}
              onClick={handlePostComment}
              disabled={!commentText.trim() || posting}
              aria-label="Post comment"
              title="Post comment"
            >
              Post
            </button>
          </div>
        </div>
        <ul className={styles.commentList}>
          {comments.map((c) => (
            <li key={c.id} className={styles.commentItem}>
              <p className={styles.commentBody}>{c.body}</p>
              <button
                type="button"
                className={styles.reportBtn}
                onClick={() => handleReport(c.id)}
                disabled={reportingId === c.id}
                aria-label="Report"
                title="Report comment"
              >
                <Flag size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
