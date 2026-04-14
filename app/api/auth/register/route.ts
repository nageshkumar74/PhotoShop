import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { email, password } = await request.json();

    // ✅ Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Normalize input
    const normalizedEmail = email.trim().toLowerCase();
    

    // ✅ Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const newUser = await User.create({
      email: normalizedEmail,
      password:password,
      role: "user",
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser._id,
          email: newUser.email,
          role:newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}