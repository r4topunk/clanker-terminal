"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  const handleClick = async () => {
    alert("Soon I said ୧༼ಠ益ಠ༽୨");
  };
  return (
    <div className="flex gap-1 items-center justify-center min-h-screen py-2">
      <Button onClick={handleClick}>Soon...</Button>
      <ThemeToggle />
    </div>
  );
}
