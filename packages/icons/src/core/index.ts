/** Geometry is independent of React and of the platform renderer. */
export interface IconDefinition {
  readonly name: string;
  readonly body: string;
  /** Default stroke in the 24-unit grid; chart artwork uses 1.5. */
  readonly strokeWidth?: number;
}

export interface IconPaint {
  color?: string;
  fill?: string;
  strokeWidth?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
}

export const ICON_SIZE = 24;
export const ICON_STROKE_WIDTH = 2;

const escapeAttribute = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]!);

/** An SVG document, suitable for an image source, server response, or export. */
export function toSvg(definition: IconDefinition, {
  color = 'currentColor', fill = 'none', strokeWidth = definition.strokeWidth ?? ICON_STROKE_WIDTH,
  strokeLinecap = 'round', strokeLinejoin = 'round',
}: IconPaint = {}): string {
  if (!Number.isFinite(strokeWidth) || strokeWidth < 0) throw new RangeError('strokeWidth must be finite and nonnegative');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" color="${escapeAttribute(color)}" fill="${escapeAttribute(fill)}" stroke="${escapeAttribute(color)}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}">${definition.body}</svg>`;
}

/** URI-encode XML so # colors and accessibility text cannot break the source. */
export function toDataUri(definition: IconDefinition, paint?: IconPaint): string {
  return `data:image/svg+xml,${encodeURIComponent(toSvg(definition, paint))}`;
}
