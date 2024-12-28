"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

interface PaginationProps {
  page: number;
  take: number;
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ page, take, totalPages }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("take", take.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex justify-between items-center mt-4 mb-2">
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => navigate(page - 1)}
      >
        <ChevronLeft />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => navigate(page + 1)}
      >
        Next
        <ChevronRight />
      </Button>
    </div>
  );
};

export default Pagination;
