
"use client"

import { IKUpload } from "imagekitio-next";




import { Loader2 } from "lucide-react";
import { useState } from "react";

 
export default function FileUpload({
    onSuccess ,
}:{
    onSuccess:(res:any)=>void;
}){
    const [uploading,setUploading]=useState(false);
    const [error,setError]=useState<string |null>(null);


    const onError=(err:{message:string})=>{
        setError(err.message);
        setUploading(false);
    };
    const handleSuccess =(response:any)=>{
        setUploading(false);
        setError(null);
        onSuccess(response);

    };
    const handleStartUpload=()=>{
        setUploading(true);
        setError(null);
    };

    return (
        <div className="space y-2">
         <IKUpload fileName="product-image.jpg"
         publicKey={process.env.NEXT_PUBLIC_PUBLIC_KEY} 
         urlEndpoint={process.env.NEXT_PUBLIC_URL_ENDPOINT}
         authenticator={async () => {
    const res = await fetch("/api/auth/upload-auth");
    return res.json();
         }}
         onError={onError}  onSuccess={handleSuccess}
         onUploadStart={handleStartUpload}
         className="file-input file-input-borderd w-full"
         validateFile={(file:File)=>{
            const validTypes=["image/jpeg","image/png","image/webp"]
            if(!validTypes.includes(file.type)){
                setError("Please Upload a valid image File (JPEG,PNG or webP)");
                return false;
            }
            if(file.size > 5 *1024*1024){
                setError("File size must less than 5MB");
                return false;
            }
            return true;
        }}
        />
        {uploading && (
            <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="w-4 h-4 animate-spin">

                </Loader2>
                <span>Uploading...!</span>

            </div>
        )}
        
             {error &&<div className="text-error text-sm">{error}</div>}



        </div>
    )
}

