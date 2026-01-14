export const CONFIG = {
  MAX_FILE_BYTES: 10 * 1024 * 1024,
  ALLOWED_MIME: new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    // videos
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime", // .mov
  ]),
  MAX_CHATS: 15,
  POSTHOG_KEY: "phc_2qafhOCTgCnygXsPEHOA0RBtJf5nvVsi7yIene4DWaF",
  POSTHOG_HOST: "https://us.i.posthog.com",
};
