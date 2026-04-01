import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Products";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectToDatabase();

    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json(
        { error: "Product not Found" },
        { status: 404 }
      );
    }

    const formattedProduct=JSON.parse(JSON.stringify(product));
    

    return NextResponse.json(formattedProduct, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to Fetch Product" },
      { status: 500 }
    );
  }
}