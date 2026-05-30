

import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Orders";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID!,
    key_secret:process.env.RAZORPAY_KEY_SECRET!,
});


export async function POST(request:Request){
    try{
        const session = await getServerSession(authOptions);
        if(!session){
            return NextResponse.json({error:"Unauthorized user"},{status:400})
        }
        
        const body = await request.json();
        
        // Check if this is a mark-completed request
        if (body.action === "mark-completed") {
          return handleMarkCompleted(body, session);
        }

        // Otherwise, create a new order
        const {productId,variant}=body;
        await connectToDatabase();

        //create razorpay order
        const order= await razorpay.orders.create({
            amount:Math.round(variant.price*100),
            currency:"INR",

            receipt:`recept-${Date.now()}`,
            notes:{
                productId:productId.toString(),
            }
        })
        const newOrder=await Order.create({
            userId:session.user.id,
            productId,
            variant,
            razorpayOrderId:order.id,
            amount:Math.round(variant.price*100),
            status:"pending"
        })

        return NextResponse.json({
            orderId:order.id,
            amount:order.amount,
            currrency:order.currency,
            dbOrderId:newOrder._id,
        })
    }
    catch(error){
        console.log(error);
        return NextResponse.json({error:"Payment failed"},{status:500})
    }
}

// Handle marking order as completed after payment
async function handleMarkCompleted(body: any, session: any) {
  try {
    const { dbOrderId, paymentId } = body;

    if (!dbOrderId || !paymentId) {
      return NextResponse.json(
        { error: "dbOrderId and paymentId required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    console.log(`🔄 [Mark Completed] Updating order ${dbOrderId} with payment ${paymentId}`);

    // Update order status to completed
    const updatedOrder = await Order.findByIdAndUpdate(
      dbOrderId,
      {
        razorpayPaymentId: paymentId,
        status: "completed",
      },
      { new: true }
    );

    if (!updatedOrder) {
      console.error(`❌ Order not found: ${dbOrderId}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(`✅ [Mark Completed] Order updated: ${dbOrderId}`);

    return NextResponse.json({
      success: true,
      message: "Order marked as completed",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ [Mark Completed] Error:", error);
    return NextResponse.json(
      { error: "Failed to mark order as completed" },
      { status: 500 }
    );
  }
}