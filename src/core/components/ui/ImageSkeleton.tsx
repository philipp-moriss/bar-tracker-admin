import React from "react";

interface ImageSkeletonProps {
  className?: string;
  aspectRatio?: string;
}

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({ className = '', aspectRatio = '4/3' }) => (
  <div
    className={`w-full aspect-[${aspectRatio}] bg-gray-200 animate-pulse rounded-t-2xl ${className}`}
  />
); 