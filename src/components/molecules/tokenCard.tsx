import { formatDistanceToNow } from "date-fns";
import { CircleDollarSign, Clock, Flame, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Address } from "viem";

export interface Token {
  name: string;
  address: Address;
  symbol: string;
  imageUrl?: string;
  deployer: {
    username: string;
    avatarUrl: string;
    followers: number;
    score: number;
  };
  deployedAt: string;
  marketCap: number;
  volumeLastHour: number;
}

interface TokenCardProps {
  token: Token;
}

export function TokenCard({ token }: TokenCardProps) {
  const timeAgo = formatDistanceToNow(new Date(token.deployedAt), {
    addSuffix: true,
  });

  return (
    <div className="flex flex-col justify-between bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link
        href={`https://www.clanker.world/clanker/${token.address}`}
        className="block"
        target="_blank"
        prefetch={false}
      >
        <div className="relative h-48">
          <Image
            key={token.name}
            src={token?.imageUrl || ""}
            alt={token.name}
            className="w-full h-full object-cover"
            width={500}
            height={500}
          />
          <div className="absolute top-4 right-4 bg-black/70 dark:bg-gray-700 px-3 py-1 rounded-full">
            <span className="text-white dark:text-gray-200 font-medium">
              {token.symbol}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {token.name}
            </h3>
            {/* <div className="flex items-center space-x-1"> */}
            {/* <Trophy className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {token.deployer.score}
              </span> */}
            {/* </div> */}
          </div>
        </div>
      </Link>

      <div className="px-6 pb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center hover:opacity-80 cursor-pointer">
            <Image
              src={token.deployer.avatarUrl}
              alt={token.deployer.username}
              className="w-8 h-8 rounded-full mr-2"
              width={32}
              height={32}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                @{token.deployer.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {token.deployer.followers.toLocaleString()} followers
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">
              {token.deployer.score}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
            <span>{timeAgo}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <Flame className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>
                $
                {token.volumeLastHour.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center">
              <CircleDollarSign className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>
                $
                {token.marketCap.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}