'use client';

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-blue-primary/10 via-yellow-accent/20 to-blue-primary/10 ${className}`}
      aria-hidden="true"
    />
  );
}

