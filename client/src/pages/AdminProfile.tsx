import { useParking } from "@/lib/parking-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, Phone, User, BadgeCheck, Mail, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminProfile() {
  const { logoutAdmin, isAdmin } = useParking();
  const [, setLocation] = useLocation();

  if (!isAdmin) {
    setLocation("/admin/login");
    return null;
  }

  const handleLogout = () => {
    logoutAdmin();
    setLocation("/");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
        <Badge variant="outline" className="gap-1 px-3 py-1 border-primary/50 text-primary bg-primary/10">
          <Shield className="w-3 h-3 fill-current" />
          Official Access
        </Badge>
      </div>

      <Card className="border-primary/20 shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-600/20 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 mb-6 gap-4">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-2">
              <h2 className="text-2xl font-bold">Sabarimala Traffic Control</h2>
              <p className="text-muted-foreground">Chief Parking Coordinator</p>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="gap-2 shadow-sm">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <div className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1 p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  Police ID
                </div>
                <div className="text-lg font-mono font-semibold tracking-wide">POL-KERALA-575</div>
              </div>
              
              <div className="space-y-1 p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  Emergency Contact
                </div>
                <div className="text-lg font-mono font-semibold tracking-wide">+91 94979 00000</div>
              </div>

              <div className="space-y-1 p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  Official Email
                </div>
                <div className="text-lg font-semibold">police@gmail.com</div>
              </div>

              <div className="space-y-1 p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  Station Base
                </div>
                <div className="text-lg font-semibold">Nilakkal Base Camp</div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Administrative Privileges
              </h3>
              <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-1">
                <li>Full access to real-time parking dashboard</li>
                <li>Authority to update zone capacities and status</li>
                <li>Access to vehicle search and tracking system</li>
                <li>Emergency override controls for traffic management</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}