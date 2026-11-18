import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-sm font-medium tracking-widest text-jute-deep uppercase">404</p>
      <h1 className="text-3xl">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
