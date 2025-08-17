import { useRef, useState } from "react";
import { FALLBACK_IMG } from "@/lib/cloudinary";
import { reportClientError } from "@/lib/errorTracking"; // your local LETS client

const seen = new Set<string>(); // session dedupe

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  logKey?: string; // identifier for observability (e.g., "category:<slug>")
};

export default function ImageWithFallback({ src, logKey, alt = "", ...rest }: Props) {
  const [current, setCurrent] = useState(src);
  const errored = useRef(false);

  return (
    <img
      {...rest}
      alt={alt}
      loading="lazy"
      decoding="async"
      src={current}
      onError={() => {
        if (!errored.current) {
          errored.current = true;
          // Log only once per unique URL per session
          if (current && !seen.has(current)) {
            seen.add(current);
            // DISABLED: Error reporting disabled to stop validation loop
            // reportClientError({
            //   level: "warn",
            //   message: `Failed to load img: ${current}`,
            //   type: "ResourceError",
            //   extra: { logKey, kind: "img" },
            // });
          }
          setCurrent(FALLBACK_IMG);
        }
      }}
    />
  );
}