import { useState, type ImgHTMLAttributes } from "react";

/**
 * <img> that disappears instead of showing a broken-image icon when its
 * source fails — used wherever the picture comes from wp-admin or the
 * placeholder set and may legitimately be missing; the container's
 * background then shows through.
 */
export default function Img({ className = "", onError, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      {...rest}
      className={className}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
