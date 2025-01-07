import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Flame, Clock } from "lucide-react";
import Link from "next/link";
import { Address } from "viem";
import Image from "next/image";

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
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/token/${token.address}`} className="block">
        <div className="relative h-48">
          <Image
            src={token?.imageUrl || ""}
            alt={token.name}
            className="w-full h-full object-cover"
            width={500}
            height={500}
          />
          <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full">
            <span className="text-white font-medium">{token.symbol}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{token.name}</h3>
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{token.deployer.score}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-6 pb-6">
        <div className="flex items-center mb-4">
          <div className="flex items-center hover:opacity-80 cursor-pointer">
            <Image
              src={token.deployer.avatarUrl}
              alt={token.deployer.username}
              className="w-8 h-8 rounded-full mr-2"
              width={32}
              height={32}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                @{token.deployer.username}
              </p>
              <p className="text-xs text-gray-500">
                {token.deployer.followers.toLocaleString()} followers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center">
            <Flame className="w-4 h-4 mr-1 text-orange-500" />
            <span>${token.volumeLastHour.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
