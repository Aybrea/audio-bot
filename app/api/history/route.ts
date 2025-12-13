import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const day = searchParams.get("day");

  if (!month || !day) {
    return NextResponse.json(
      { error: "Month and day are required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HistoryApp/1.0)",
          "Api-User-Agent": "HistoryApp/1.0 (contact@example.com)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Wikipedia API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching history data:", error);

    return NextResponse.json(
      { error: "Failed to fetch history data" },
      { status: 500 }
    );
  }
}
