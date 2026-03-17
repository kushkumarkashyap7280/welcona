import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl font-light tracking-tighter text-primary">404</h1>
        <h2 className="text-2xl font-medium tracking-wide uppercase">Page Not Found</h2>
        <div className="h-px w-16 bg-primary/20 mx-auto" />
        <p className="text-muted-foreground">
          We apologize, but the page you are looking for cannot be found or has been moved. 
          Please check the URL or return to our homepage.
        </p>
        <div className="pt-4">
          <Button asChild size="lg" className="rounded-none">
            <Link href="/">RETURN HOME</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
