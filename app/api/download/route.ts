import {NextRequest } from "next/server";

export async function GET(request:NextRequest){

    const imageUrl=request.nextUrl.searchParams.get("imageUrl");

    if(!imageUrl){
        return new Response("Image URL is required",{status:400})
    }

    const imageResponse=await fetch(imageUrl);
    if(!imageResponse.ok){
        return new Response("Failed to fetch image",{status:500})
    }
    const buffer=await imageResponse.arrayBuffer();
    return new Response(buffer,{
        headers:{
            "Content-Type":imageResponse.headers.get("content-type")||"image/jpeg",
            "Content-Disposition":`attachement;filename="downloade_image.jpg`,
        }
    })
}