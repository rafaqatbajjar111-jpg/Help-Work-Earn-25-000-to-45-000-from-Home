import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { db, auth } from "@/src/lib/firebase";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  LogOut, 
  Check, 
  X, 
  Trash2, 
  ExternalLink,
  Save,
  QrCode,
  MessageSquare,
  ArrowLeft
} from "lucide-react";
import { Logo } from "../components/Logo";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

const ADMIN_EMAILS = ["mrkhatab112@gmail.com", "rkkhatab872@gmail.com"];

export default function Admin() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"applications" | "settings" | "account">("applications");
  const [applications, setApplications] = useState<any[]>([]);
  const [upiId, setUpiId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setNewEmail(u.email || "");
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email || "")) {
      const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
      const unsubApps = onSnapshot(q, (snapshot) => {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        const errInfo = {
          error: error.message,
          operationType: "list",
          path: "applications",
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
          }
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
        toast.error("Permission denied to view applications");
      });

      const unsubSettings = onSnapshot(doc(db, "settings", "payment"), (doc) => {
        if (doc.exists()) {
          setUpiId(doc.data().upiId || "");
          setQrUrl(doc.data().qr || "");
        }
      }, (error) => {
        console.error('Firestore Error in settings/payment: ', error);
      });

      const unsubConfig = onSnapshot(doc(db, "settings", "config"), (doc) => {
        if (doc.exists()) {
          setWhatsapp(doc.data().whatsapp || "");
        }
      }, (error) => {
        console.error('Firestore Error in settings/config: ', error);
      });

      return () => {
        unsubApps();
        unsubSettings();
        unsubConfig();
      };
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === "reset") {
      if (!email) {
        toast.error("Please enter your email");
        return;
      }
      setIsAuthProcessing(true);
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success("Password reset link sent to your email");
        setAuthMode("login");
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsAuthProcessing(false);
      }
      return;
    }

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setIsAuthProcessing(true);
    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error("Invalid credentials");
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error("This email is already registered");
      } else {
        toast.error("Authentication failed: " + error.message);
      }
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "applications", id), { status });
      toast.success(`Application ${status}`);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const deleteApplication = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await deleteDoc(doc(db, "applications", id));
        toast.success("Application deleted");
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "payment"), { upiId, qr: qrUrl }, { merge: true });
      await setDoc(doc(db, "settings", "config"), { whatsapp }, { merge: true });
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Save failed");
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdatingAccount(true);
    try {
      if (newEmail && newEmail !== user.email) {
        await updateEmail(user, newEmail);
        toast.success("Email updated successfully.");
      }
      if (newPassword) {
        await updatePassword(user, newPassword);
        toast.success("Password updated successfully.");
        setNewPassword("");
      }
    } catch (error: any) {
      console.error("Update account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Sensitive action: Please log out and back in and try again immediately.");
      } else {
        toast.error("Update failed: " + error.message);
      }
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
            <Logo className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight uppercase">
              {authMode === "login" ? "Admin Login" : authMode === "signup" ? "Create Admin" : "Reset Password"}
            </h1>
            <p className="text-neutral-400 text-sm">
              {authMode === "login" 
                ? "Secure access for authorized administrators" 
                : authMode === "signup" 
                  ? "Register a new administrator account" 
                  : "Enter your email to receive a reset link"}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Admin Email</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-5 py-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            
            {authMode !== "reset" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mr-1">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Password</label>
                  {authMode === "login" && (
                    <button 
                      type="button" 
                      onClick={() => setAuthMode("reset")}
                      className="text-[10px] uppercase font-bold text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthProcessing}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-black py-4 rounded-xl shadow-lg transition-all mt-4 uppercase tracking-widest"
            >
              {isAuthProcessing 
                ? "Processing..." 
                : authMode === "login" 
                  ? "Sign In" 
                  : authMode === "signup" 
                    ? "Create Account" 
                    : "Send Reset Link"}
            </button>
          </form>

          <div className="pt-2">
            {authMode === "login" ? (
              <p className="text-sm text-neutral-500">
                Don't have an account?{" "}
                <button 
                  onClick={() => setAuthMode("signup")}
                  className="text-primary font-bold hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <button 
                onClick={() => setAuthMode("login")}
                className="text-sm text-neutral-500 flex items-center justify-center gap-1 mx-auto hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            )}
          </div>

          {user && !ADMIN_EMAILS.includes(user.email || "") && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-500 font-bold flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Access Denied: {user.email}
              </p>
              <button onClick={handleLogout} className="text-xs text-neutral-500 mt-2 underline hover:text-white">Sign Out</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-neutral-900 border-r border-neutral-800 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 text-primary" />
          <span className="font-black tracking-tight text-xl uppercase">HW Admin</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab("applications")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              activeTab === "applications" ? "bg-primary text-primary-foreground" : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <Users className="w-5 h-5" /> Applications
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              activeTab === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button 
            onClick={() => setActiveTab("account")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              activeTab === "account" ? "bg-primary text-primary-foreground" : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <Users className="w-5 h-5" /> Account Settings
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-center">
          <h2 className="text-4xl font-black tracking-tighter uppercase">
            {activeTab === "applications" ? "User Submissions" : activeTab === "settings" ? "Platform Config" : "Account Settings"}
          </h2>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Active Admin</p>
            <p className="text-sm font-bold text-primary">{user.email}</p>
          </div>
        </header>

        {activeTab === "applications" && (
          <div className="space-y-6">
            {applications.length === 0 ? (
              <div className="p-20 border-2 border-dashed border-neutral-800 rounded-[2rem] text-center">
                <p className="text-neutral-500 font-bold uppercase tracking-widest">No applications found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col lg:flex-row justify-between gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                      <div>
                        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Applicant</p>
                        <p className="font-black text-lg">{app.name}</p>
                        <p className="text-sm text-neutral-400 font-mono">{app.mobile}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Project & Fee</p>
                        <p className="font-bold text-primary">{app.project}</p>
                        <p className="text-sm text-neutral-400">₹{app.amount} Paid</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">UTR / TRANS ID</p>
                        <p className="font-mono text-white bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800 w-fit">{app.utr}</p>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Email Address</p>
                        <p className="text-sm text-neutral-300 leading-relaxed">{app.email}</p>
                      </div>
                    </div>

                    <div className="flex lg:flex-col justify-end gap-3 shrink-0 lg:border-l lg:border-neutral-800 lg:pl-8">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateStatus(app.id, "approved")}
                          disabled={app.status === "approved"}
                          className={cn(
                            "flex-1 lg:flex-none p-4 rounded-2xl transition-all",
                            app.status === "approved" ? "bg-green-500/20 text-green-500" : "bg-neutral-800 hover:bg-green-500 text-white"
                          )}
                          title="Approve"
                        >
                          <Check className="w-5 h-5 mx-auto" />
                        </button>
                        <button 
                          onClick={() => updateStatus(app.id, "rejected")}
                          disabled={app.status === "rejected"}
                          className={cn(
                            "flex-1 lg:flex-none p-4 rounded-2xl transition-all",
                            app.status === "rejected" ? "bg-red-500/20 text-red-500" : "bg-neutral-800 hover:bg-red-500 text-white"
                          )}
                          title="Reject"
                        >
                          <X className="w-5 h-5 mx-auto" />
                        </button>
                        <button 
                          onClick={() => deleteApplication(app.id)}
                          className="flex-1 lg:flex-none p-4 rounded-2xl bg-neutral-800 hover:bg-red-600 text-white transition-all shadow-lg"
                        >
                          <Trash2 className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                      <div className="bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-800 text-center">
                        <p className="text-[10px] font-black text-neutral-500 uppercase">Status</p>
                        <p className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          app.status === "pending" ? "text-yellow-500" : app.status === "approved" ? "text-green-500" : "text-red-500"
                        )}>
                          {app.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          {activeTab === "account" && (
            <div className="max-w-xl space-y-8">
              <div className="glass-card rounded-[2.5rem] p-8 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <Users className="text-primary w-6 h-6" /> Profile Update
                  </h3>
                  <form onSubmit={handleUpdateAccount} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Change Email</label>
                      <input 
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-neutral-950 border border-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">New Password (optional)</label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-6 py-4 rounded-2xl bg-neutral-950 border border-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isUpdatingAccount}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                      {isUpdatingAccount ? "Updating..." : <><Save className="w-6 h-6" /> Save Profile</>}
                    </button>
                  </form>
                </div>
              </div>
              <div className="p-6 rounded-3xl border-2 border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-500/80 font-bold leading-relaxed">
                  ⚠️ Crucial: After changing your email, ensure you update the ADMIN_EMAILS constant in the code to keep dashboard access.
                </p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
          <div className="max-w-2xl space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <QrCode className="text-primary w-6 h-6" /> Payment Settings
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">UPI ID</label>
                    <input 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. example@ybl"
                      className="w-full px-6 py-4 rounded-2xl bg-neutral-950 border border-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">Optional QR Image URL</label>
                    <input 
                      value={qrUrl}
                      onChange={(e) => setQrUrl(e.target.value)}
                      placeholder="Https://... image link"
                      className="w-full px-6 py-4 rounded-2xl bg-neutral-950 border border-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    />
                    <p className="text-[10px] text-neutral-600 font-bold ml-1 italic">Leave empty to auto-generate QR from UPI ID</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <MessageSquare className="text-primary w-6 h-6" /> Support Config
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">WhatsApp Number</label>
                  <input 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="91xxxxxxxxxx"
                    className="w-full px-6 py-4 rounded-2xl bg-neutral-950 border border-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button 
                onClick={saveSettings}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 outline-none ring-offset-neutral-900 transition-all uppercase tracking-widest"
              >
                <Save className="w-6 h-6" /> Save All Settings
              </button>
            </div>

            <div className="p-6 rounded-3xl border-2 border-yellow-500/20 bg-yellow-500/5">
              <p className="text-sm text-yellow-500/80 font-bold leading-relaxed">
                ℹ️ These settings update the registration page instantly. Users will see the new UPI details and support number as soon as you save.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
