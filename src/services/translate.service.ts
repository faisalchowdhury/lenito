// services/translate.service.ts
export const translateText = async (
  text: string,
  targetLang: string
): Promise<string> => {
  if (targetLang === "en") return text;

  // Force mock translation
  return `[${targetLang}] ${text}`;
};
