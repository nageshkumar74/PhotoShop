import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Orders";
import nodemailer from 'nodemailer';
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    console.log("🔔 [Razorpay Webhook] Received event");

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ [Razorpay Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log(`✅ [Razorpay Webhook] Event verified: ${event.event}`);

    await connectToDatabase();

    // Handle payment.captured (most common)
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      console.log(`💰 [Razorpay Webhook] Processing payment for order: ${payment.order_id}`);

      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          status: "completed",
        },
        { new: true }
      ).populate([
        { path: "userId", select: "email name" },
        { path: "productId", select: "name" },
      ]);

      if (!order) {
        console.warn(`⚠️ [Razorpay Webhook] Order not found for razorpayOrderId: ${payment.order_id}`);
        return NextResponse.json({ received: true });
      }

      console.log(`📦 [Razorpay Webhook] Order updated: ${order._id}`);

      // Send confirmation email
      try {
        const transporter = nodemailer.createTransport({
          host: "sandbox.smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: process.env.MAILTRAP_USER!,
            pass: process.env.MAILTRAP_PASS!,
          },
        });

        const mailResponse = await transporter.sendMail({
          from: '"ImageKit Shop" <noreply@imagekitshop.com>',
          to: order.userId.email,
          subject: "✅ Payment Confirmed - ImageKit Shop",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Payment Confirmed!</h2>
              <p>Hi ${order.userId.name || order.userId.email},</p>
              <p>Thank you for your purchase! Your order has been successfully placed.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Details:</h3>
                <p><strong>Order ID:</strong> #${order._id.toString().slice(-6)}</p>
                <p><strong>Product:</strong> ${order.productId.name}</p>
                <p><strong>Version:</strong> ${order.variant.type}</p>
                <p><strong>License:</strong> ${order.variant.license}</p>
                <p><strong>Amount:</strong> ₹${(order.amount / 100).toFixed(2)}</p>
              </div>

              <p>Your high-quality image is now available for download in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="color: #2563eb;">orders page</a>.</p>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Thank you for shopping with ImageKit Shop!<br>
                If you have any questions, please contact our support team.
              </p>
            </div>
          `,
        });

        console.log(`📧 [Razorpay Webhook] Email sent successfully`);
      } catch (emailError) {
        console.error(`❌ [Razorpay Webhook] Email sending failed:`, emailError);
        // Don't fail the webhook if email fails - order is already updated
      }
    } 
    // Handle payment.authorized (sometimes sent instead of payment.captured)
    else if (event.event === "payment.authorized") {
      const payment = event.payload.payment.entity;
      console.log(`✅ [Razorpay Webhook] Payment authorized for order: ${payment.order_id}`);
      // Payment is authorized but not captured yet - mark as completed
      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          status: "completed",
        }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ [Razorpay Webhook] Fatal error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
