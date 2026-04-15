import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Product, { IProduct } from "@/models/Products";
import mongoose from 'mongoose';

import { getServerSession } from "next-auth/next";
import { NextResponse, NextRequest } from "next/server";
export async function GET() {
    try {
        await connectToDatabase();
        const products = await Product.find({}).lean();
        const formattedProducts = JSON.parse(JSON.stringify(products));

        return NextResponse.json(formattedProducts, { status: 200 })
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Something Went wrong" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);
        const allowedRoles = ["admin", "user"];
        if (!session || !allowedRoles.includes(session.user?.role)) {
            return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
        }

        const body: IProduct = await request.json();
        if (!body.name ||
            !body.description ||

            !body.imageUrl ||
            body.variants.length === 0

        ) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 })
        }

        const newProduct = await Product.create(body);
        return NextResponse.json({ newProduct }, { status: 201 })
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Registration error' }, { status: 500 })

    }
}
export async function DELETE(request: NextRequest) {

    try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);

        const allowedRoles = ["admin", "user"];
        if (!session || !allowedRoles.includes(session.user?.role)) {
            return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
        }
        else {
            const { searchParams } = new URL(request.url);
            const productID = searchParams.get("id");

            if (!productID) {
                return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
            }

            if(!mongoose.Types.ObjectId.isValid(productID)){


                return NextResponse.json({error:"Invalid Product ,Id"},{status:400})
            }
            else {
                const deletedProduct = await Product.findByIdAndDelete(productID);
                if (!deletedProduct) {
                    return NextResponse.json({ error: "Product not found" }, { status: 404 })
                }
                else {
                    return NextResponse.json({ message: "Product deleted Sucessfully" }, { status: 200 })
                }

            }
        }

    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}