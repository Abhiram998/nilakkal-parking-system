import { Link, useLocation } from "wouter";
import { Car, ShieldCheck, Home, Menu, User, Ticket, BarChart3, LogIn } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show layout on login pages
  if (location === '/login' || location === '/admin/login') {
    return <>{children}</>;
  }

  const NavLinks = () => (
    <>
      <Link href="/">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${location === '/' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </div>
      </Link>
      <Link href="/ticket">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${location === '/ticket' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}>
          <Ticket className="w-4 h-4" />
          <span>My Ticket</span>
        </div>
      </Link>
      <Link href="/predictions">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${location === '/predictions' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}>
          <BarChart3 className="w-4 h-4" />
          <span>Forecast</span>
        </div>
      </Link>
      <Link href="/profile">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${location === '/profile' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}>
          <User className="w-4 h-4" />
          <span>Profile</span>
        </div>
      </Link>
      <div className="border-t my-2 md:border-l md:border-t-0 md:my-0 md:mx-2 md:h-6 opacity-20" />
      <Link href="/admin">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${location.startsWith('/admin') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}>
          <ShieldCheck className="w-4 h-4" />
          <span>Police Admin</span>
        </div>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight text-foreground">Nilakkal Parking</h1>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sabarimala Base Camp</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLinks />
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px]">
                <div className="flex flex-col gap-2 mt-8">
                  <NavLinks />
                  <div className="mt-auto border-t pt-4">
                    <Link href="/login">
                      <Button variant="outline" className="w-full gap-2">
                        <LogIn className="w-4 h-4" /> Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-20">
        {children}
      </main>
    </div>
  );
}