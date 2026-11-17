import {createElement, type ReactNode, type Ref} from 'react';
import {Image, type ImageProps} from 'expo-image';
import {type IconDefinition, type IconPaint} from '../core/index.js';
import {iconSource} from './source.js';

export interface IconProps extends Omit<ImageProps, 'source' | 'children' | 'tintColor' | 'ref' | 'width' | 'height'>, IconPaint {
  size?: number;
  width?: number;
  height?: number;
  absoluteStrokeWidth?: boolean;
  ref?: Ref<Image>;
}
export type IconComponent = (props: IconProps) => ReactNode;

/** One native image view; no path views, fonts, network requests or SVG parser in JS. */
export function createIcon(definition: IconDefinition): IconComponent {
  function Icon({size = 24, width = size, height = size, color = '#000000', fill = 'none',
    strokeWidth = 2, strokeLinecap = 'round', strokeLinejoin = 'round', absoluteStrokeWidth = false,
    style, accessibilityLabel, accessible = !!accessibilityLabel, ...props}: IconProps) {
    if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height))) return null;
    // Native tint respects the host's React Native color space (including iOS P3).
    // On iOS Expo rasterizes tinted SVGs at the view size; the source stays vector.
    // Explicit two-color fills use SVG paint instead.
    const tinted = fill === 'none' || fill === 'currentColor' || fill === color;
    const source = iconSource(definition, {color: tinted ? '#000000' : color,
      fill: tinted && fill !== 'none' ? '#000000' : fill, strokeLinecap, strokeLinejoin,
      strokeWidth: absoluteStrokeWidth ? strokeWidth * 24 / Math.min(width, height) : strokeWidth});
    return createElement(Image, {
      accessible, accessibilityLabel, accessibilityRole: accessible ? 'image' : undefined,
      accessibilityElementsHidden: !accessible, importantForAccessibility: accessible ? 'yes' : 'no-hide-descendants',
      pointerEvents: 'none', cachePolicy: 'memory', transition: 0, contentFit: 'contain',
      ...props, source, tintColor: tinted ? color : undefined, style: [{width, height, flexShrink: 0}, style],
    });
  }
  Icon.displayName = `${definition.name}Icon`;
  return Icon;
}
