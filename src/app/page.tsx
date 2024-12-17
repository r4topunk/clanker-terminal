"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GithubIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const handleClick = async () => {
    alert("Soon I said ୧༼ಠ益ಠ༽୨");
  };
  return (
    <div className="flex gap-1 items-center justify-center min-h-screen py-2">
      <Button onClick={handleClick}>Soon...</Button>
      <Link
        target="_blank"
        href={"https://github.com/r4topunk/clanker-terminal"}
      >
        <Button size={"icon"} variant={"outline"}>
          <GithubIcon />
        </Button>
      </Link>
      <ThemeToggle />
    </div>
  );
}
