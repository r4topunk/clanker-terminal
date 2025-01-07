import ClankerTokenABI from "@/abis/clankerTokenV2";
import { publicClient } from "@/lib/viem";
import { Address, getContract } from "viem";

async function fetchTokenDataV2(tokenAddress: string, poolAddress: string) {
  // console.log(`V2: Fetching market cap for pool ${poolAddress}`);
  try {
    const tokenContract = getContract({
      address: tokenAddress as Address,
      abi: ClankerTokenABI,
      client: publicClient,
    });

    const [decimals, supply, deployer] = await Promise.all([
      tokenContract.read.decimals(),
      tokenContract.read.totalSupply(),
      tokenContract.read.deployer(),
    ]);

    return {
      decimals,
      supply,
      deployer,
    };

    // const tokenContract = new ethers.Contract(tokenAddress, ClankerTokenABI, provider) as any
    // const poolContract = new ethers.Contract(
    //   poolAddress,
    //   IUniswapV3PoolABI.abi,
    //   provider
    // ) as any;

    // const [slot0, decimals, supply, deployer] = await Promise.all([
    //   poolContract.slot0(),
    //   tokenContract.decimals(),
    //   tokenContract.totalSupply(),
    //   tokenContract.deployer()
    // ]);

    // const sqrtPriceX96 = slot0.sqrtPriceX96;
    // const intDecimals = parseInt(decimals.toString());
    // const intSupply = parseInt(ethers.formatUnits(supply))
    // const price = calculatePrice(sqrtPriceX96 as bigint, 18, intDecimals);
    // const priceUsd = price * ethPrice;
    // const marketCap = priceUsd * intSupply;
    // return {
    //   marketCap,
    //   usdPrice: priceUsd,
    //   decimals: intDecimals,
    // owner: getAddress(deployer)
    // }
  } catch (e) {
    if (e instanceof Error) {
      console.log(
        `Error fetching market cap for pool ${poolAddress}: ${e.message}`
      );
    }
    return {
      marketCap: 0,
      usdPrice: 0,
      decimals: 0,
      owner: null,
    };
  }
}

async function main() {
  const tokenAddress = "0x24898c577B8A233903D843a8d7ABD4B55daC05c0";
  const poolAddress = "0xC1a6FBeDAe68E1472DbB91FE29B51F7a0Bd44F97";

  const data = await fetchTokenDataV2(tokenAddress, poolAddress);
  console.log("Token data:", data);
}

main().catch(console.error);
