import { NextResponse } from "next/server";
import { sourceService, ScrapingSource } from "@/lib/sourceService";

export async function GET() {
  try {
    const sources = await sourceService.getAllSources();
    return NextResponse.json(sources, { status: 200 });
  } catch (error: any) {
    console.error("API Error fetching all sources:", error);
    return NextResponse.json(
      { message: "Error fetching sources", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data: ScrapingSource = await request.json();
    const newSource = await sourceService.createSource(data);
    return NextResponse.json(newSource, { status: 201 });
  } catch (error: any) {
    console.error("API Error creating source:", error);
    return NextResponse.json(
      { message: "Error creating source", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data: ScrapingSource = await request.json();
    if (!data.id) {
      return NextResponse.json({ message: "Source ID is required for update" }, { status: 400 });
    }
    const updatedSource = await sourceService.updateSource(data.id, data);
    if (!updatedSource) {
      return NextResponse.json({ message: "Source not found" }, { status: 404 });
    }
    return NextResponse.json(updatedSource, { status: 200 });
  } catch (error: any) {
    console.error("API Error updating source:", error);
    return NextResponse.json(
      { message: "Error updating source", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: "Source ID is required for deletion" }, { status: 400 });
    }
    await sourceService.deleteSource(id);
    return NextResponse.json({ message: "Source deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("API Error deleting source:", error);
    return NextResponse.json(
      { message: "Error deleting source", error: error.message },
      { status: 500 }
    );
  }
}
