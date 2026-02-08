interface NeedleIconProps {
  size?: number;
  className?: string;
}

export function NeedleIcon({ size = 14, className }: NeedleIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 426.82 427.15"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d="M367.31,15.54C340.81,42.05,0,427.15,0,427.15c0,0,379.12-336.18,411.61-367.31,38.83-38.83-4.25-84.34-44.3-44.3ZM378.08,74.15c-16.68,16.68-35.8,24.58-42.72,17.66-6.92-6.92.99-26.05,17.66-42.72,16.68-16.68,35.8-24.58,42.72-17.66,6.92,6.92-.99,26.05-17.66,42.72Z" />
    </svg>
  );
}
