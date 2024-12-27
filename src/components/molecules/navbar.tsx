import React from "react";
import { Button } from "../ui/button";
import { GithubIcon, Link } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";

function Navbar() {
  return (
    <div className="flex w-full gap-1 items-center justify-center">
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

export default Navbar;
