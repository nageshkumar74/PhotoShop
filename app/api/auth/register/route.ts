import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import nodemailer from "nodemailer";

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
  const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

await transporter.sendMail({
  from: '"ImagePixel" <noreply@imagepixel.com>',
  to: newUser.email,
  subject: "Welcome to ImagePixel 🎉",
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to ImagePixel 🎉</h2>

      <p>Hi ${newUser.email},</p>

      <p>Your account has been created successfully.</p>

      <p>You can now:</p>
      <ul>
        <li>Browse premium images</li>
        <li>Purchase high-quality downloads</li>
        <li>Access your orders anytime</li>
      </ul>

      <a
        href="https://photo-shop-sigma.vercel.app"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#2563eb;
          color:white;
          text-decoration:none;
          border-radius:6px;
        "
      >
        Visit ImagePixel
      </a>

      <p style="margin-top:20px;">
        Thank you for joining ImagePixel.
      </p>
    </div>
  `,
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