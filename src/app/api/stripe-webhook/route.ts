import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY as string,
    {
        apiVersion: "2024-11-20.acacia"
    }
);

const {
    WEBHOOK_SECRET_KEY,
    ENGINE_URL,
    ENGINE_ACCESS_TOKEN,
    NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
    BACKEND_WALLET_ADDRESS,
    CHAIN_ID,
} = process.env;
export async function POST(req: NextRequest){
    if(!WEBHOOK_SECRET_KEY){
        throw 'Error';
    }
    const body = await req.text();
    const sig = headers().get("stripe-signature") as string;
    if(!sig){
        throw 'No signature Provided';
    }
    const event = stripe.webhooks.constructEvent(
        body,
        sig,
        WEBHOOK_SECRET_KEY
    );
    switch(event.type){
        case "charge.succeeded": await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;
    }
    return NextResponse.json({ message:"Success"})
}

const handleChargeSucceeded =async (charge: Stripe.Charge)=>{
    if(!ENGINE_URL || !ENGINE_ACCESS_TOKEN || !NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS){
        throw 'Server misconfigured'
    }
    const {buyerWalletAddress} = charge.metadata;
    if(!buyerWalletAddress){
        throw 'No buyer wallet address'
    }
    try{
        const  tx = await fetch(
            `${ENGINE_URL}/contract/${CHAIN_ID}/${NEXT_PUBLIC_NFT_CONTRACT_ADDRESS}/erc721/mint-to`,
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    Authorization: `Bearer ${ENGINE_ACCESS_TOKEN}`,
                    "x-backend-wallet-address":BACKEND_WALLET_ADDRESS,
                },
                body:JSON.stringify({
                        "receiver": buyerWalletAddress,
                        "metadata": {
                          "name": "My NFT",
                          "description": "My NFT description",
                          "image": "ipfs://QmciR3WLJsf2BgzTSjbG5zCxsrEQ8PqsHK7JWGWsDSNo46/nft.png"
                        }
                })
            }
    )
    if(!tx.ok){
        throw 'Failed to mint NFT';
    }
    }catch(error){
        console.error(error);
    }
}