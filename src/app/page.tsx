"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  const handleClick = async () => {
    const res = await fetch("/api/webhook", {
      method: "POST",
    });
    const data = await res.json();
    console.log(data);
  };
  return (
    <div className="flex gap-1 items-center justify-center min-h-screen py-2">
      <Button onClick={handleClick}>Click me</Button>
      <ThemeToggle />
    </div>
  );
}
