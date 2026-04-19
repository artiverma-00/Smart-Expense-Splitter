import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VALID_CATEGORIES = [
  "food",
  "travel",
  "rent",
  "entertainment",
  "utilities",
  "shopping",
  "health",
  "other",
];

export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

export function getGeminiModel() {
  if (!isGeminiConfigured()) return null;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
    return null;
  }
}

function stripCodeFences(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

function extractJsonArray(text) {
  const cleaned = stripCodeFences(text).trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) return [];

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return [];
    }
  }
}

function buildFallbackInsights(spendingData) {
  const categoryBreakdown = spendingData?.categoryBreakdown || {};
  const categoryEntries = Object.entries(categoryBreakdown)
    .map(([name, data]) => ({
      name,
      total: Number(data?.total || 0),
      count: Number(data?.count || 0),
    }))
    .sort((left, right) => right.total - left.total);

  if (categoryEntries.length === 0) {
    return [
      {
        title: "Start tracking",
        message:
          "Add a few expenses first and insights will highlight your biggest spending patterns.",
        type: "info",
      },
    ];
  }

  const topCategory = categoryEntries[0];
  const totalSpent = categoryEntries.reduce((sum, item) => sum + item.total, 0);
  const topShare =
    totalSpent > 0 ? Math.round((topCategory.total / totalSpent) * 100) : 0;

  const insights = [
    {
      title: "Top category",
      message: `${topCategory.name} leads spending with ₹${Math.round(topCategory.total)} across ${topCategory.count} expense${topCategory.count === 1 ? "" : "s"}.`,
      type: "warning",
    },
  ];

  if (categoryEntries[1]) {
    insights.push({
      title: "Next biggest bucket",
      message: `${categoryEntries[1].name} is the second largest category, which gives you a clear place to trim costs.`,
      type: "info",
    });
  }

  insights.push({
    title: "Spending concentration",
    message: `${topShare}% of recorded spend sits in ${topCategory.name}, so even a small reduction there will have the most impact.`,
    type: "success",
  });

  return insights;
}

export async function categorizeExpense(title, description = "") {
  const model = getGeminiModel();
  if (!model) return { category: "other", source: "fallback" };

  const prompt = `
    Categorize this expense into exactly one of these categories:
    ${VALID_CATEGORIES.join(", ")}

    Expense title: "${title}"
    Description: "${description}"

    Reply with ONLY the category name in lowercase. No explanation.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().toLowerCase();
    return {
      category: VALID_CATEGORIES.includes(text) ? text : "other",
      source: "ai",
    };
  } catch (error) {
    console.error("Gemini categorize error:", error);
    return { category: "other", source: "fallback" };
  }
}

export async function generateInsights(spendingData) {
  const model = getGeminiModel();
  if (!model) {
    return {
      insights: buildFallbackInsights(spendingData),
      source: "fallback",
    };
  }

  const prompt = `
    You are a smart personal finance assistant.
    Analyze the following group expense data and give 3-4 short, friendly insights.
    Focus on spending patterns, biggest categories, and tips to save money.

    Data: ${JSON.stringify(spendingData)}

    Format your response as a JSON array like:
    [
      { "title": "Short title", "message": "Insight message", "type": "info|warning|success" }
    ]
    Reply ONLY with the JSON array. No markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    const parsed = extractJsonArray(result.response.text());
    const insights =
      Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : buildFallbackInsights(spendingData);

    return {
      insights,
      source: Array.isArray(parsed) && parsed.length > 0 ? "ai" : "fallback",
    };
  } catch (error) {
    console.error("Gemini insights error:", error);
    return {
      insights: buildFallbackInsights(spendingData),
      source: "fallback",
    };
  }
}
