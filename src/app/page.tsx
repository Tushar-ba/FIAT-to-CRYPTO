'use client';

import { ConnectButton, ConnectEmbed, useActiveAccount } from "thirdweb/react";
import { client } from "./client";
import { chain } from "./chain";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useElements, useStripe, PaymentElement, Elements } from "@stripe/react-stripe-js";

export default function Home() {
  const account = useActiveAccount();
  const [clientSecret, setClientSecret] = useState<string>("");

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error("No Stripe publishable key found");
  }

  const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  const onClick = async () => {
    const res = await fetch("/api/stripe-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerWalletAddress: account?.address }),
    });

    if (res.ok) {
      const json = await res.json();
      setClientSecret(json.clientSecret);
    }
  };

  return (
    <div>
      {account ? (
        <>
          <ConnectEmbed client={client} chain={chain} />
          <div>
            {!clientSecret ? (
              <button onClick={onClick} disabled={!account}>
                Buy with credit card
              </button>
            ) : (
              <Elements
                options={{
                  clientSecret: clientSecret,
                  appearance: { theme: "night" },
                }}
                stripe={stripe}
              >
                <CreditCardForm />
              </Elements>
            )}
          </div>
        </>
      ) : (
        <>
          <p>TEST</p>
          <ConnectButton client={client} chain={chain} />
          <div>Hello</div>
        </>
      )}
    </div>
  );
}


const CreditCardForm = ()=>{
  const elements = useElements();
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isComplete, setIsCompleted] = useState<boolean>(false);
  const onClick = async () =>{
    if(!stripe || !elements){
      return;
    }
    setIsLoading(true);
    try {
      const {paymentIntent, error} = await stripe.confirmPayment({
        elements,
        confirmParams:{
          return_url:"http://localhost:3000",
        },
        redirect:"if_required"
      })
      if(error){
        throw error.message;
      }
      if(paymentIntent.status === "succeeded"){
        setIsCompleted(true);
        alert ("success")
      }
    } catch (error) {
      alert("There is an error")
    }
  };
  return(
    <>
      <PaymentElement/>
      <button onClick={onClick} disabled = {isLoading || isComplete || !stripe || !elements}>
        {isComplete?"Payment completed":isLoading?"Payment processing":"Pay Now"}
      </button>
    </>
  )
}