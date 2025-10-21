// src/utils/translate.js
export const translateText = async (text, targetLang) => {
  try {
    const response = await fetch("http://localhost:3001/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang }),
    });

    const data = await response.json();
    if (data.translated) return data.translated;
    return text; // fallback si falla
  } catch (error) {
    console.error("Error al traducir:", error);
    return text;
  }
};
