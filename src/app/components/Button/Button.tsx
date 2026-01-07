// src/app/Button/Button.tsx

import type React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button data-variant={variant} {...props} />;
}
