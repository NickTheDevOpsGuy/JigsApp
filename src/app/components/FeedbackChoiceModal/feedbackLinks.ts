export const DEFAULT_BUG_FORM_URL = "https://formspree.io/f/mkovdelv";
export const DEFAULT_FEATURE_FORM_URL = "https://formspree.io/f/mnjberkr";

export const FEEDBACK_FORM_TARGETS = {
  bug: import.meta.env.VITE_FORMSPREE_BUG_FORM_ID?.trim() || DEFAULT_BUG_FORM_URL,
  feature:
    import.meta.env.VITE_FORMSPREE_FEATURE_FORM_ID?.trim() || DEFAULT_FEATURE_FORM_URL,
} as const;

export function normalizeFeedbackFormUrl(target: string): string | null {
  if (!target) return null;
  return /^https?:\/\//i.test(target) ? target : `https://formspree.io/f/${target}`;
}
