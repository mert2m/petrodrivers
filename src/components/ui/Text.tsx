import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';
import { typography } from '@/theme/tokens';

export type TextVariant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Tailwind classes; defaults to primary foreground. Pass e.g. "text-fg-secondary" to override. */
  className?: string;
}

/** Typed text primitive. Size/weight from the type scale (tokens); color via NativeWind classes. */
export function Text({ variant = 'body', style, className, ...rest }: TextProps) {
  return (
    <RNText style={[typography[variant], style]} className={cn('text-fg', className)} {...rest} />
  );
}
