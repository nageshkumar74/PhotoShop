
"use client"
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { IOrder } from "@/types/Order";
import { Loader2, Download } from "lucide-react";
import { IKImage } from "imagekitio-next";
import { IMAGE_VARIANTS } from "@/constants/imageVariants";
import { apiClient } from "@/lib/api-client";

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
console.log("NEXT_PUBLIC_URL_ENDPOINT =", process.env.NEXT_PUBLIC_URL_ENDPOINT);
  const fetchOrders = async () => {
    try {
      const data = await apiClient.getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchOrders();
  }, [session]);

  // Refetch orders every 3 seconds for 30 seconds to catch webhook updates
  useEffect(() => {
    const hasPendingOrders = orders.some(order => order.status === "pending");

    if (!hasPendingOrders) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, [orders]);


  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }


  const handleDownload=async(
    imageUrl:string,
    width:number,
    height:number,
    orderId:string
  )=>{
    const cleanImageUrl=imageUrl.replace(/^\/+/,"");

    const downloadUrl=`${process.env.NEXT_PUBLIC_URL_ENDPOINT}/${cleanImageUrl}`
    console.log("Download URL:", downloadUrl);
    const response=await fetch(downloadUrl);

    const blob=await response.blob();
    const blobUrl=window.URL.createObjectURL(blob);

    const link=document.createElement("a");
    link.href=blobUrl;
    link.download=`image-${orderId.slice(-6)}.jpg`;
    document.body.appendChild(link);
    link.click();
      document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          const variantDimensions =
            IMAGE_VARIANTS[
              order.variant.type.toUpperCase() as keyof typeof IMAGE_VARIANTS
            ].dimensions;

          const product = order.productId as any;

          return (
            <div
              key={order._id?.toString()}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Preview Image - Low Quality */}
                  <div
                    className="relative rounded-lg overflow-hidden bg-base-200"
                    style={{
                      width: "200px",
                      aspectRatio: `${variantDimensions.width} / ${variantDimensions.height}`,
                    }}
                  >
                    <IKImage
                      urlEndpoint={process.env.NEXT_PUBLIC_URL_ENDPOINT}
                      path={product.imageUrl}
                      alt={`Order ${order._id?.toString().slice(-6)}`}
                      transformation={[
                        {

                          width: variantDimensions.width.toString(),
                          height: variantDimensions.height.toString(),
                          cropMode: "extract",
                          focus: "center",
                        },
                      ]}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Order Details */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold mb-2">
                          Order #{order._id?.toString().slice(-6)}
                        </h2>
                        <div className="space-y-1 text-base-content/70">
                          <p>
                            Resolution: {variantDimensions.width} x{" "}
                            {variantDimensions.height}px
                          </p>
                          <p>
                            License Type:{" "}
                            <span className="capitalize">
                              {order.variant.license}
                            </span>
                          </p>
                          <p>
                            Status:{" "}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === "completed"
                                ? "bg-success/20 text-success"
                                : order.status === "failed"
                                  ? "bg-error/20 text-error"
                                  : "bg-warning/20 text-warning"
                                }`}
                            >
                              {order.status}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold mb-4">
                          ₹{(order.amount / 100).toFixed(2)}
                        </p>
                        {order.status === "completed" && (
                          <button
                            onClick={() =>
                              handleDownload(
                                product.imageUrl,
                                variantDimensions.width,
                                variantDimensions.height,
                                order._id?.toString() || ""
                              )
                            }
                            className="btn btn-primary gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download High Quality
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-base-content/70 text-lg">No orders found</div>
          </div>
        )}
      </div>
    </div>
  );
}