import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex gap-1 items-center justify-center min-h-screen py-2">
      <Button>Click me</Button>
      <ThemeToggle />
    </div>
  );
}
