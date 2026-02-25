import { useState, useEffect } from "react";
import { fetchBlob } from "../services/files";

/**
 * Resolves a src that is either:
 *   - an HTTP(S) URL (old signed URL) -> returned as-is
 *   - a file path (new format)        -> fetched via auth, returned as blob URL
 *
 * Returns { src, loading, error }
 */
export function useAuthSrc(rawSrc, getToken) {
  const isHttp =
    rawSrc &&
    (rawSrc.startsWith("http://") || rawSrc.startsWith("https://"));

  const [blobSrc, setBlobSrc] = useState(null);
  const [loading, setLoading] = useState(!isHttp && !!rawSrc);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rawSrc || isHttp) return;

    let revoke = null;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchBlob(rawSrc, getToken)
      .then((url) => {
        if (cancelled) return;
        if (url) {
          revoke = url;
          setBlobSrc(url);
        } else {
          setError("Failed to load file");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load file");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [rawSrc, getToken, isHttp]);

  return {
    src: isHttp ? rawSrc : blobSrc,
    loading,
    error,
  };
}
