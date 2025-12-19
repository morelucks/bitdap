import { NextResponse } from "next/server";

/**
 * GET endpoint to retrieve events
 * This is a simple endpoint that returns events stored client-side
 * In production, this would query a database
 */
export async function GET() {
  try {
    // In a real app, this would query your database
    // For now, return empty array - events are managed client-side via localStorage
    return NextResponse.json({
      events: [],
      message: "Events are managed client-side. Check localStorage for 'bitdap_events'",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

