import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { connectToDatabase } from "./db";

import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions:NextAuthOptions={
    providers:[
        CredentialsProvider({
            name:"Credentials",
            credentials:{
                email:{label:"Email" ,type:"text"},
                password:{label:"Password",type:"password"},
            },
            async authorize(credentials, req){

                try{
                    if(!credentials?.email || !credentials?.password){
                        return null;
                    }

                    await connectToDatabase();

                    const user=await User.findOne({email:credentials.email.trim().toLowerCase()}).select("+password");
                       
                    if(!user){
                        console.log("User not found");
                        return null;
                    }
                    console.log("Enterd password",credentials.password);
                    console.log("Stored password",user.password);
                    const manualTest = await bcrypt.compare("test123", user.password);
                   console.log("Manual test (test123):", manualTest);
                    const isValid=await bcrypt.compare(
                        credentials.password.trim(),
                        user.password
                    );
                    console.log("Password match:", isValid);
                    if(!isValid){
                        return null;
                    }

                    return {
                        id:user._id.toString(),
                        email:user.email,
                        role:user.role
                    };  
                }
                catch(error){
                    console.log("Auth error:",error)
                    return null;
                }
            }
        }),

    ],
    callbacks:{
        async jwt({token,user}){
            if(user){
                token.id=user.id;
                token.role=user.role;
            }
            return token;
        },
        async session({session,token}){
            if(session.user){
                session.user.id=token.id as string;
                session.user.role=token.role as string;

            }
            return session;
        },
    },
    pages:{
        signIn:"/login",
        error:"/login",

    },
    session:{
        strategy:"jwt",
        maxAge:30*24*60*60
    },
    secret:process.env.NEXTAUTH_SECRET
}