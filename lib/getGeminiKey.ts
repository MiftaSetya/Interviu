export const getGeminiKeys = () => {
  const keys = [
    process.env.GEMINI_API_KEY_MAIN,
    process.env.GEMINI_API_KEY_BACKUP1,
    process.env.GEMINI_API_KEY_BACKUP2,
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error("No Gemini API keys found");
  }

  return keys;
};
