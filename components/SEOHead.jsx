import { useEffect, useState } from "react";

/**
 * SEOHead Component
 *
 * Dynamically manages meta tags for SEO, ensuring:
 * - Auth routes (/auth, Clerk routes) are marked noindex, nofollow
 * - Protected pages behind authentication are marked noindex
 * - Public pages can be indexed
 */
export const SEOHead = ({ isAuthenticated, isPublic = false, meta = {} }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Listen for route changes via popstate and manual path checks
  useEffect(() => {
    const updatePath = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);

    // Also check periodically for SPA navigation
    const interval = setInterval(updatePath, 100);

    return () => {
      window.removeEventListener("popstate", updatePath);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Determine if current route should be indexed
    const isAuthRoute = currentPath === "/auth" ||
                       currentPath.startsWith("/sign-in") ||
                       currentPath.startsWith("/sign-up") ||
                       currentPath.includes("clerk");

    // Protected pages (requires auth) should not be indexed
    const shouldNoIndex = isAuthRoute || (isAuthenticated && !isPublic);

    // Update robots meta tag
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement("meta");
      robotsTag.setAttribute("name", "robots");
      document.head.appendChild(robotsTag);
    }

    if (shouldNoIndex) {
      robotsTag.setAttribute("content", "noindex, nofollow");
    } else {
      robotsTag.setAttribute("content", "index, follow");
    }

    // Update googlebot meta tag specifically
    let googlebotTag = document.querySelector('meta[name="googlebot"]');
    if (!googlebotTag) {
      googlebotTag = document.createElement("meta");
      googlebotTag.setAttribute("name", "googlebot");
      document.head.appendChild(googlebotTag);
    }

    if (shouldNoIndex) {
      googlebotTag.setAttribute("content", "noindex, nofollow");
    } else {
      googlebotTag.setAttribute("content", "index, follow");
    }

    // Update title from meta config if provided
    if (meta.title) {
      document.title = meta.title;
    }

    // Update description meta tag if provided
    if (meta.description) {
      let descTag = document.querySelector('meta[name="description"]');
      if (!descTag) {
        descTag = document.createElement("meta");
        descTag.setAttribute("name", "description");
        document.head.appendChild(descTag);
      }
      descTag.setAttribute("content", meta.description);
    }

    // Add canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }

    const canonicalUrl = meta.canonical || window.location.origin + currentPath;
    canonicalTag.setAttribute("href", canonicalUrl);

    // Clean up function
    return () => {
      // Optionally reset to defaults when component unmounts
      // This prevents stale meta tags if routing changes rapidly
    };
  }, [currentPath, isAuthenticated, isPublic, meta]);

  return null; // This component doesn't render anything
};

/**
 * Hook to update meta tags imperatively
 */
export const useUpdateSEO = () => {
  const updateMeta = ({ robots, title, description, canonical }) => {
    if (robots) {
      let robotsTag = document.querySelector('meta[name="robots"]');
      if (!robotsTag) {
        robotsTag = document.createElement("meta");
        robotsTag.setAttribute("name", "robots");
        document.head.appendChild(robotsTag);
      }
      robotsTag.setAttribute("content", robots);

      let googlebotTag = document.querySelector('meta[name="googlebot"]');
      if (!googlebotTag) {
        googlebotTag = document.createElement("meta");
        googlebotTag.setAttribute("name", "googlebot");
        document.head.appendChild(googlebotTag);
      }
      googlebotTag.setAttribute("content", robots);
    }

    if (title) {
      document.title = title;
    }

    if (description) {
      let descTag = document.querySelector('meta[name="description"]');
      if (!descTag) {
        descTag = document.createElement("meta");
        descTag.setAttribute("name", "description");
        document.head.appendChild(descTag);
      }
      descTag.setAttribute("content", description);
    }

    if (canonical) {
      let canonicalTag = document.querySelector('link[rel="canonical"]');
      if (!canonicalTag) {
        canonicalTag = document.createElement("link");
        canonicalTag.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.setAttribute("href", canonical);
    }
  };

  return updateMeta;
};
