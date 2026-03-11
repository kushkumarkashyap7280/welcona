export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Welcona. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
