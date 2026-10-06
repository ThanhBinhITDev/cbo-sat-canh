/** Icon thương hiệu — lucide-react không còn bộ icon Facebook/Messenger. */

export function FacebookIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function MessengerIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.26.58l.05 1.85c.02.6.65 1 1.18.71l2.06-1.12c.17-.09.36-.11.53-.06.91.25 1.88.38 2.83.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6.05 7.7-2.78 4.42c-.44.7-1.42.9-2.12.42l-2.17-1.45c-.19-.13-.44-.14-.64-.03l-2.94 1.76c-.42.25-.95-.14-.76-.6l2.78-4.42c.44-.7 1.42-.9 2.12-.42l2.17 1.45c.19.13.44.14.64.03l2.94-1.76c.42-.25.95.14.76.6Z" />
    </svg>
  );
}
