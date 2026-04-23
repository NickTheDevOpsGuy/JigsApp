/**
 * Shared layout widths so JS `matchMedia` matches CSS `@media (max-width: 600px)` and
 * the tablet band matches `AppModal` / modal mid-range rules.
 */
export const LAYOUT_PHONE_MAX_PX = 600;
export const LAYOUT_TABLET_MAX_PX = 1024;

/** Narrow phone / small window — same as most play CSS breakpoints */
export const layoutPhoneMediaQuery = `(max-width: ${LAYOUT_PHONE_MAX_PX}px)`;

/** Tablet / small laptop — not phone, not wide desktop */
export const layoutTabletOnlyMediaQuery = `(min-width: ${LAYOUT_PHONE_MAX_PX + 1}px) and (max-width: ${LAYOUT_TABLET_MAX_PX}px)`;

/** Win overlay: compact when phone-width or on shorter desktop/tablet windows */
export const layoutPhoneOrShortWinMediaQuery = `${layoutPhoneMediaQuery}, (max-height: 840px)`;

/** Anchored celebration dialog max width on wider viewports (px) */
export const LAYOUT_ANCHORED_DIALOG_MAX_WIDTH_PX = 600;
