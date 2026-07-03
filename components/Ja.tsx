import type { ReactNode, HTMLAttributes } from 'react';

interface JaProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Ja({ children, ...rest }: JaProps) {
  return (
    <span lang="ja" {...rest}>
      {children}
    </span>
  );
}
