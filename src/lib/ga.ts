import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { readFile } from "fs/promises";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

interface GAData {
  totalViews: number;
  changePercent: number;
  trend: "up" | "down";
  weeklyViews: number[];
  weekLabels: string[];
  isMock: boolean;
  googleAnalyticsId?: string;
}

// Default fallback mock data to keep the UI beautiful
const MOCK_DATA: GAData = {
  totalViews: 94720,
  changePercent: 22,
  trend: "up",
  weeklyViews: [1420, 2680, 1540, 3900, 2720, 4100, 3240],
  weekLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  isMock: true,
};

async function readSettings(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

export async function getGoogleAnalyticsData(): Promise<GAData> {
  try {
    const settings = await readSettings();
    const googleAnalyticsId = settings.googleAnalyticsId?.trim() || "";
    const propertyId = settings.gaPropertyId?.trim();
    const clientEmail = settings.gaClientEmail?.trim();
    const privateKey = settings.gaPrivateKey?.trim();

    if (!propertyId || !clientEmail || !privateKey) {
      return {
        ...MOCK_DATA,
        isMock: true,
        googleAnalyticsId,
      };
    }

    // Instantiation
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
    });

    // Fetch daily page views for last 7 days (including today)
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "7daysAgo",
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "date", // Returns YYYYMMDD
        },
      ],
      metrics: [
        {
          name: "screenPageViews",
        },
      ],
      keepEmptyRows: true,
    });

    // Parse the rows
    const rows = response.rows || [];
    
    // Sort rows chronologically by date
    const sortedRows = [...rows].sort((a, b) => {
      const dateA = a.dimensionValues?.[0]?.value || "";
      const dateB = b.dimensionValues?.[0]?.value || "";
      return dateA.localeCompare(dateB);
    });

    const weeklyViews: number[] = [];
    const weekLabels: string[] = [];

    sortedRows.forEach((row) => {
      const dateStr = row.dimensionValues?.[0]?.value || ""; // e.g. 20260517
      const views = parseInt(row.metricValues?.[0]?.value || "0", 10);
      weeklyViews.push(views);

      // Convert "20260517" to "Sun" or similar short day name
      if (dateStr.length === 8) {
        const year = parseInt(dateStr.slice(0, 4), 10);
        const month = parseInt(dateStr.slice(4, 6), 10) - 1;
        const day = parseInt(dateStr.slice(6, 8), 10);
        const dateObj = new Date(year, month, day);
        const label = dateObj.toLocaleDateString("en-US", { weekday: "short" });
        weekLabels.push(label);
      } else {
        weekLabels.push(dateStr);
      }
    });

    // Fallback if no rows returned
    if (weeklyViews.length === 0) {
      return {
        ...MOCK_DATA,
        isMock: true,
        googleAnalyticsId,
      };
    }

    // Calculate totalViews
    const totalViews = weeklyViews.reduce((acc, curr) => acc + curr, 0);

    // Calculate percent change from previous 7 days vs these 7 days (if possible)
    // To keep it simple and robust, let's fetch the previous 7 days to calculate change
    const [prevResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "14daysAgo",
          endDate: "8daysAgo",
        },
      ],
      metrics: [
        {
          name: "screenPageViews",
        },
      ],
    });

    const prevTotal = parseInt(prevResponse.rows?.[0]?.metricValues?.[0]?.value || "0", 10);
    
    let changePercent = 0;
    let trend: "up" | "down" = "up";

    if (prevTotal > 0) {
      const diff = totalViews - prevTotal;
      changePercent = Math.round((Math.abs(diff) / prevTotal) * 100);
      trend = diff >= 0 ? "up" : "down";
    } else {
      changePercent = totalViews > 0 ? 100 : 0;
      trend = "up";
    }

    return {
      totalViews,
      changePercent,
      trend,
      weeklyViews,
      weekLabels,
      isMock: false,
      googleAnalyticsId,
    };
  } catch (err) {
    console.error("[GA4 API Error]", err);
    // Graceful fallback to mock data on error so dashboard doesn't crash
    const settings = await readSettings().catch(() => ({} as Record<string, string>));
    const googleAnalyticsId = settings.googleAnalyticsId?.trim() || "";
    return {
      ...MOCK_DATA,
      isMock: true,
      googleAnalyticsId,
    };
  }
}
