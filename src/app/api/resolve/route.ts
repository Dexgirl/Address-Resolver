import { NextResponse } from "next/server";
import { ethers } from "ethers";

interface Transaction {
  from?: string;
  to?: string;
}

interface ResolvedAddress {
  address: string;
  balance: string;
  isContract: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const partialAddress = body.partialAddress as string;

    if (!partialAddress) {
      return NextResponse.json(
        { error: "Partial address is required" },
        { status: 400 }
      );
    }

    const parts = partialAddress.split("...");

    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid format. Use: 0xabc...xyz" },
        { status: 400 }
      );
    }

    const prefix = parts[0].toLowerCase();
    const suffix = parts[1].toLowerCase();

    const provider = new ethers.JsonRpcProvider(
      "https://eth.llamarpc.com"
    );

    const matches: ResolvedAddress[] = [];

    try {
      const latestBlock = await provider.getBlockNumber();

      for (let i = 0; i < 10 && matches.length < 5; i++) {
        const blockNumber = latestBlock - i;
        const block = await provider.getBlock(blockNumber, true);

        if (block && block.transactions) {
          for (const txData of block.transactions) {
            const txString = typeof txData === "string" ? txData : txData;

            if (typeof txString === "string") {
              continue;
            }

            const txObj = txString as Transaction;
            const from = txObj.from ? txObj.from.toLowerCase() : "";
            const to = txObj.to ? txObj.to.toLowerCase() : "";

            if (
              from &&
              from.startsWith(prefix) &&
              from.endsWith(suffix)
            ) {
              await addMatch(matches, from, provider);
            }

            if (
              to &&
              to.startsWith(prefix) &&
              to.endsWith(suffix)
            ) {
              await addMatch(matches, to, provider);
            }

            if (matches.length >= 5) {
              break;
            }
          }
        }
      }
    } catch (blockError) {
      console.error("Blockchain scan error:", blockError);
    }

    if (matches.length === 0) {
      return NextResponse.json({
        message: "No matches found in recent blocks",
        matches: [],
      });
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Resolution error:", error);
    return NextResponse.json(
      { error: "Failed to resolve address" },
      { status: 500 }
    );
  }
}

async function addMatch(
  matches: ResolvedAddress[],
  address: string,
  provider: ethers.JsonRpcProvider
) {
  if (matches.find((m) => m.address === address)) {
    return;
  }

  try {
    const balance = await provider.getBalance(address);
    const code = await provider.getCode(address);

    matches.push({
      address: address,
      balance: ethers.formatEther(balance),
      isContract: code !== "0x",
    });
  } catch (matchError) {
    matches.push({
      address: address,
      balance: "0",
      isContract: false,
    });
  }
}
