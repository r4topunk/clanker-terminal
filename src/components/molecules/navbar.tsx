import { GithubIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

function Navbar() {
  return (
    <div className="flex w-full gap-1 items-center justify-center">
      <Link className={buttonVariants({ variant: "outline" })} href={"/"}>
        Home
      </Link>
      <Link className={buttonVariants({ variant: "outline" })} href={"/table"}>
        Table
      </Link>
      <Link
        className={buttonVariants({ size: "icon", variant: "outline" })}
        target="_blank"
        href={"https://github.com/r4topunk/clanker-terminal"}
      >
        <GithubIcon />
      </Link>
      <ThemeToggle />
    </div>
  );
}

export default Navbar;
