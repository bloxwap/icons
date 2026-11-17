import {createElement, type ReactNode, type Ref, type SVGProps} from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
  ref?: Ref<SVGSVGElement>;
}
export type IconComponent = (props: IconProps) => ReactNode;

/** Generated children are created once per module, not mapped on every render. */
export function createIcon(name: string, geometry: ReactNode, defaultStrokeWidth = 2): IconComponent {
  function Icon({size = 24, color = 'currentColor', strokeWidth = defaultStrokeWidth,
    absoluteStrokeWidth = false, children, className, ...props}: IconProps) {
    const named = !!(props['aria-label'] || props['aria-labelledby']);
    return createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg', width: size, height: size,
      viewBox: '0 0 24 24', fill: 'none', color, stroke: color, strokeWidth,
      strokeLinecap: 'round', strokeLinejoin: 'round', focusable: false,
      'aria-hidden': named ? undefined : true, role: named ? 'img' : undefined,
      ...props,
      // vector-effect works with CSS sizes and non-square dimensions too.
      ...(absoluteStrokeWidth ? {strokeWidth, style: {...props.style, '--bloxwap-icon-vector-effect': 'non-scaling-stroke'} as SVGProps<SVGSVGElement>['style']} : {}),
      className: ['bloxwap-icon', `bloxwap-icon-${name}`, className].filter(Boolean).join(' '),
    }, geometry, children);
  }
  Icon.displayName = `${name}Icon`;
  return Icon;
}
