export const translations = {
  en: {
    // Sidebar
    dashboard: "Dashboard",
    reviewStudio: "Review studio",
    activityLog: "Activity log",
    casesIndexed: "Cases indexed",
    needsReview: "Needs review",
    approved: "Approved",
    avgConfidence: "Avg. confidence",
    extractionEngine: "Extraction engine",
    openaiEnabled: "OpenAI + heuristic",
    heuristicOnly: "Heuristic only",
    openaiModel: "Model",
    enableOpenAI: "Set OPENAI_API_KEY to enable the model-backed path.",

    // Dashboard
    dashboardTitle: "Judgment operations center",
    dashboardDescription:
      "Real documents, persistent review state, approval workflows, and extraction that can scale from heuristics to OpenAI-assisted review.",

    // Language selection
    language: "Language",
    english: "English",
    kannada: "ಕನ್ನಡ",

    // Common actions
    upload: "Upload",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    cancel: "Cancel",
    search: "Search",
    filter: "Filter",

    // Case-related
    caseNumber: "Case Number",
    caseTitle: "Case Title",
    court: "Court",
    judge: "Judge",
    petitioner: "Petitioner",
    respondent: "Respondent",
    status: "Status",
    riskLevel: "Risk Level",
    confidence: "Confidence",
    summary: "Summary",

    // Status
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    inReview: "In Review",

    // Risk levels
    low: "Low",
    medium: "Medium",
    high: "High",
  },
  kn: {
    // Sidebar
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    reviewStudio: "ವಿಮರ್ಶೆ ಸ್ಟುಡಿಯೋ",
    activityLog: "ಚಟುವಟಿಕೆ ಪ್ರವೃತ್ತಿ",
    casesIndexed: "ಪ್ರಕರಣಗಳು ಸೂಚಿಮುಖ",
    needsReview: "ವಿಮರ್ಶೆ ಅಗತ್ಯ",
    approved: "ಅನುಮೋದಿತ",
    avgConfidence: "ಸರಾಸರಿ ಆತ್ಮವಿಶ್ವಾಸ",
    extractionEngine: "ಹೊರತೆಗೆಯುವ ಇಂಜಿನ್",
    openaiEnabled: "OpenAI + ಹೊರೆತಿಕೆ",
    heuristicOnly: "ಹೊರೆತಿಕೆ ಮಾತ್ರ",
    openaiModel: "ಮಾದರಿ",
    enableOpenAI:
      "ಮಾದರಿ-ಬ್ಯಾಕಿಂಗ್ ಮಾರ್ಗವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು OPENAI_API_KEY ಹೊಂದಿಸಿ.",

    // Dashboard
    dashboardTitle: "ತೀರ್ಪು ಕಾರ್ಯ ಕೇಂದ್ರ",
    dashboardDescription:
      "ನೈಜ ದಾಖಲೆಗಳು, ನಿರಂತರ ವಿಮರ್ಶೆ ಸ್ಥಿತಿ, ಅನುಮೋದನ ಕಾರ್ಯಪ್ರವಾಹಗಳು ಮತ್ತು ಹೊರೆತಿಕೆ ಯಂತ್ರ-ಚಾಲಿತ ವಿಮರ್ಶೆಯವರೆಗೆ ಸ್ಕೇಲ್ ಮಾಡಬಹುದು.",

    // Language selection
    language: "ಭಾಷೆ",
    english: "English",
    kannada: "ಕನ್ನಡ",

    // Common actions
    upload: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    save: "ಸಂರಕ್ಷಿಸಿ",
    delete: "ಅಳಿಸಿ",
    edit: "ಸಂಪಾದಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    search: "ಹುಡುಕಿ",
    filter: "ಪೊರೆ",

    // Case-related
    caseNumber: "ಪ್ರಕರಣ ಸಂಖ್ಯೆ",
    caseTitle: "ಪ್ರಕರಣ ಶೀರ್ಷಿಕೆ",
    court: "ನ್ಯಾಯಾಲಯ",
    judge: "ನ್ಯಾಯಾಧೀಶ",
    petitioner: "ಅರ್ಜಿದಾರ",
    respondent: "ಪ್ರತಿವಾದಿ",
    status: "ಸ್ಥಿತಿ",
    riskLevel: "ಪ್ರಮಾಣ ಮಟ್ಟ",
    confidence: "ಆತ್ಮವಿಶ್ವಾಸ",
    summary: "ಸಾರಾಂಶ",

    // Status
    pending: "ಬಾಕಿ",
    approved: "ಅನುಮೋದಿತ",
    rejected: "ತಿರಸ್ಕೃತ",
    inReview: "ವಿಮರ್ಶನೆಯಲ್ಲಿ",

    // Risk levels
    low: "ಕಡಿಮೆ",
    medium: "ಮಧ್ಯಮ",
    high: "ಹೆಚ್ಚು",
  },
};

export function useTranslations(language = "en") {
  return translations[language] || translations.en;
}
