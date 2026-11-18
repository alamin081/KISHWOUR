import { Compass } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";

export default function StoreNotFound() {
  return (
    <div className="container-page flex flex-1 items-center justify-center py-20">
      <EmptyState
        icon={Compass}
        headingAs="h1"
        className="w-full max-w-xl"
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={routes.products}>Browse products</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Go to home page</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
