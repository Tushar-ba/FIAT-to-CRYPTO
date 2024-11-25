import { chain } from "@/app/chain";
import {client} from "@/app/client";
import {getContract} from "thirdweb";



const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string;

export const contract = getContract({
    client:client,
    chain:chain,
    address: nftContractAddress,
})