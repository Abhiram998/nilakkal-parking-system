import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useParking } from "@/lib/parking-context";
import { Shield, Lock, ShieldAlert, User, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { loginAdmin, registerAdmin } = useParking();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [regName, setRegName] = useState("");
  const [regPoliceId, setRegPoliceId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (await loginAdmin(email, password)) {
      setLocation("/admin");
    } else {
      setError("Invalid ID or Password. Access Denied.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    
    if (await registerAdmin(regEmail, regPassword, regName, regPoliceId)) {
      setRegSuccess("Registration successful! You can now login.");
      setRegName("");
      setRegPoliceId("");
      setRegEmail("");
      setRegPassword("");
    } else {
      setRegError("Registration failed. Email may already exist.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 dark">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500 border border-blue-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Police Control</CardTitle>
          <CardDescription className="text-slate-400">Restricted Access. Authorized Personnel Only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-600" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-blue-600" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-id" className="text-slate-200">Officer Email</Label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input 
                      id="admin-id" 
                      placeholder="police@gmail.com" 
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-600 focus-visible:ring-blue-500" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Secure Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-600 focus-visible:ring-blue-500" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold" data-testid="button-login">
                  Authenticate
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-slate-200">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input 
                      id="reg-name" 
                      placeholder="Officer Name" 
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-600 focus-visible:ring-blue-500" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      data-testid="input-reg-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-police-id" className="text-slate-200">Police ID</Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input 
                      id="reg-police-id" 
                      placeholder="POL-KERALA-XXX" 
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-600 focus-visible:ring-blue-500" 
                      value={regPoliceId}
                      onChange={(e) => setRegPoliceId(e.target.value)}
                      required
                      data-testid="input-reg-police-id"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-slate-200">Email</Label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input 
                      id="reg-email" 
                      type="email"
                      placeholder="officer@police.gov.in" 
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-600 focus-visible:ring-blue-500" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      data-testid="input-reg-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-slate-200">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input 
                      id="reg-password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-600 focus-visible:ring-blue-500" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      data-testid="input-reg-password"
                    />
                  </div>
                </div>
                
                {regError && (
                  <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
                    {regError}
                  </div>
                )}
                
                {regSuccess && (
                  <div className="text-green-500 text-sm text-center bg-green-500/10 p-2 rounded border border-green-500/20">
                    {regSuccess}
                  </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold" data-testid="button-register">
                  Register Officer
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Link href="/">
              <span className="text-sm text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
                ← Return to Public Portal
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}