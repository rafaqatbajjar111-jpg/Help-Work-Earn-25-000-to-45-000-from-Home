import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Briefcase, 
  CircleCheckBig, 
  House, 
  MapPin, 
  MessageCircle, 
  Package, 
  Phone, 
  Shield, 
  User, 
  Users, 
  X, 
  Zap 
} from "lucide-react";
import { Logo } from "../components/Logo";
import { QRCodeSVG } from "qrcode.react";
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

// --- Types ---
interface Project {
  id: number;
  fee: number;
  pages: number;
  days: number;
  earning: string;
  label: string;
}

interface FormState {
  name: string;
  mobile: string;
  email: string;
}

// --- Data ---
const PROJECTS: Project[] = [
  { id: 1, fee: 499, pages: 30, days: 7, earning: "₹25,000", label: "" },
  { id: 2, fee: 699, pages: 50, days: 10, earning: "₹30,000", label: "Most Popular" },
  { id: 3, fee: 850, pages: 75, days: 15, earning: "₹35,000", label: "" },
  { id: 4, fee: 999, pages: 150, days: 20, earning: "₹45,000", label: "" },
];

const FEATURES = [
  { text: "10,000+ people already working", icon: Users },
  { text: "Daily parcel work available", icon: Package },
  { text: "Fast payment system", icon: Zap },
  { text: "Easy work from home job", icon: House },
];

const NAMES = ["Priya", "Neha", "Anjali", "Pooja", "Riya", "Sneha", "Kajal", "Simran", "Meena", "Aarti", "Nisha", "Komal", "Shreya", "Payal", "Tanu"];
const MALE_NAMES = ["Rahul", "Aman", "Vikas", "Rohit", "Deepak"];
const MESSAGES = ["Sir parcel received ho gaya 📦", "Mujhe job mil gayi thank you 🙏", "First salary received 💰", "Work start kar diya bahut acha hai", "Payment mil gaya sir 👍", "Parcel mil gaya kaafi easy work hai", "Registration ho gaya successfully ✅"];
const CITIES = ["Delhi", "Mumbai", "Jaipur", "Lucknow", "Pune", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Ahmedabad", "Patna", "Bhopal", "Indore", "Surat"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomNotification() {
  const isFemale = Math.random() < 0.75;
  const name = getRandomItem(isFemale ? NAMES : MALE_NAMES);
  const city = getRandomItem(CITIES);
  const message = getRandomItem(MESSAGES);
  return { name, city, message };
}

// --- Components ---

const Timer = () => {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 text-primary font-mono font-bold text-lg">
      <span className="bg-secondary/50 backdrop-blur-md border border-neutral-800 p-2 px-3 rounded-lg">
        {String(minutes).padStart(2, "0")}
      </span>
      <span>:</span>
      <span className="bg-secondary/50 backdrop-blur-md border border-neutral-800 p-2 px-3 rounded-lg">
        {String(seconds).padStart(2, "0")}
      </span>
      <span className="text-sm text-muted-foreground ml-2">left to register</span>
    </div>
  );
};

const NotificationPopup = () => {
  const [data, setData] = useState(generateRandomNotification());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setData(generateRandomNotification());
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-20 left-4 z-50 md:bottom-6 max-w-xs pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-2xl border border-primary/20 p-3 flex items-start gap-3 bg-neutral-900/80 backdrop-blur-xl shadow-2xl"
            style={{ boxShadow: "0 0 20px hsl(142 71% 45% / 0.15)" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-primary-foreground bg-gradient-to-br from-primary to-green-600">
              {data.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {data.name} <span className="text-muted-foreground font-normal text-xs text-nowrap">from {data.city}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                {data.message}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WhatsAppButton = ({ number }: { number?: string }) => {
  if (!number) return null;
  return (
    <a
      href={`https://wa.me/${number}?text=Hi%20I%20have%20a%20question%20regarding%20the%20project`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 md:bottom-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 bg-[#25D366]"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </a>
  );
};

export default function Home() {
  const [step, setStep] = useState<"home" | "form" | "payment" | "utr" | "success">("home");
  const [selectedProject, setSelectedProject] = useState<Project>(PROJECTS[1]);
  const [formData, setFormData] = useState<FormState>({ name: "", mobile: "", email: "" });
  const [utr, setUtr] = useState("");
  const [utrError, setUtrError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId] = useState(() => "HW" + Math.floor(10000 + Math.random() * 90000));
  
  // Real-time config from Firebase
  const [upiId, setUpiId] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    // Listen to payment settings
    const unsubPayment = onSnapshot(doc(db, "settings", "payment"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUpiId(data.upiId || "");
        setQrImageUrl(data.qr || "");
      }
    }, (error) => {
      console.error("Payment settings error:", error);
    });

    // Listen to general config
    const unsubConfig = onSnapshot(doc(db, "settings", "config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setWhatsappNumber(data.whatsapp || "");
      }
    }, (error) => {
      console.error("Config settings error:", error);
    });

    return () => {
      unsubPayment();
      unsubConfig();
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.mobile && formData.email) {
      setStep("payment");
    } else {
      toast.error("Please fill all fields");
    }
  };

  const handleUtrSubmit = async () => {
    if (utr.trim().length < 8) {
      setUtrError("UTR must be at least 8 characters");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "applications"), {
        ...formData,
        project: `${selectedProject.pages} Pages`,
        amount: selectedProject.fee,
        utr: utr.trim(),
        appId: applicationId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setStep("success");
      toast.success("Application submitted!");
    } catch (error) {
      console.error("Firestore error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const upiUrl = `upi://pay?pa=${upiId}&pn=Merchant&am=${selectedProject.fee}&cu=INR`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-primary/30">
      <header className="p-4 md:p-6 flex items-center justify-between max-w-7xl mx-auto w-full relative z-50">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 text-primary" />
          <span className="font-black text-2xl tracking-tighter uppercase">Help Work</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-neutral-500">
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Secure</span>
          <span className="flex items-center gap-2"><CircleCheckBig className="w-4 h-4" /> Verified</span>
        </div>
      </header>

      <NotificationPopup />
      <WhatsAppButton number={whatsappNumber} />

      {step === "home" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-neutral-950/90 backdrop-blur-lg border-t border-neutral-800">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="hidden sm:block">
              <p className="text-sm font-bold">🔥 Limited Slots Available</p>
              <p className="text-xs text-muted-foreground">Earn ₹25,000 to ₹45,000</p>
            </div>
            <button 
              onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse"
            >
              🔥 Apply Now
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {step === "home" && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="text-center py-12 md:py-20 flex flex-col items-center">
                <div className="inline-block bg-primary/10 border border-primary/20 py-2 px-4 rounded-full text-sm text-primary mb-6">
                  ⚡ Limited Slots – Apply Fast
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 tracking-tighter">
                  🚀 Help Work – <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                    Earn ₹25,000 to ₹45,000
                  </span>
                  <br /> from Home
                </h1>
                <p className="text-lg text-neutral-400 mb-6 font-medium">
                  Simple Book Typing Projects Available
                </p>
                <Timer />
                
                <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-neutral-400">
                  <div className="flex items-center gap-1.5 bg-neutral-900/50 py-2 px-4 rounded-full border border-neutral-800">
                    <Shield className="w-4 h-4 text-primary" /> Secure
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-900/50 py-2 px-4 rounded-full border border-neutral-800">
                    <CircleCheckBig className="w-4 h-4 text-primary" /> Verified
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-900/50 py-2 px-4 rounded-full border border-neutral-800">
                    <Briefcase className="w-4 h-4 text-primary" /> Easy Work
                  </div>
                </div>
              </div>

              <div id="projects" className="space-y-6">
                <h2 className="text-3xl font-black text-center tracking-tight">Choose Your Project</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {PROJECTS.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProject(project)}
                      className={cn(
                        "relative p-6 rounded-3xl border cursor-pointer transition-all duration-300",
                        selectedProject.id === project.id 
                          ? "bg-primary/5 border-primary shadow-[0_0_30px_rgba(34,197,94,0.15)] ring-2 ring-primary/50" 
                          : "bg-neutral-900/50 border-neutral-800 hover:border-primary/40"
                      )}
                    >
                      {project.label && (
                        <span className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground uppercase tracking-wider">
                          {project.label}
                        </span>
                      )}
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="font-black text-2xl">₹{project.fee}</p>
                          <p className="text-neutral-400 text-sm font-medium mt-1">Registration Fee</p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-black text-2xl uppercase">{project.earning}</p>
                          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Expected Earning</p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-2 text-sm text-neutral-300 font-medium">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <CircleCheckBig className="w-3.5 h-3.5 text-primary" />
                          </div>
                          {project.pages} Pages Project · {project.days} Days
                        </div>
                        <ul className="space-y-2 text-sm text-neutral-400">
                          <li className="flex items-center gap-2">
                            <span className="text-primary font-bold">✔</span> Registration Fee: ₹{project.fee}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-primary font-bold">✔</span> Fee refundable after first parcel 📦
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-primary font-bold">✔</span> Get 50% salary advance with first work 💰
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-primary font-bold">✔</span> Limited slots available 🚨
                          </li>
                        </ul>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setStep("form");
                        }}
                        className={cn(
                          "w-full py-3.5 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                          selectedProject.id === project.id 
                            ? "bg-primary text-primary-foreground shadow-lg" 
                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        )}
                      >
                        Select Project <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-neutral-900/30 border border-neutral-800 mb-20">
                <h3 className="text-2xl font-black mb-6 tracking-tight">Why Choose Us?</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {FEATURES.map(({ text, icon: Icon }) => (
                    <div key={text} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-neutral-300">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto py-12"
            >
              <h2 className="text-3xl font-black mb-2 tracking-tight">Registration Details</h2>
              <p className="text-neutral-400 text-sm mb-8 font-medium">
                Applying for: <span className="text-primary font-bold">{selectedProject.pages} Pages Project</span>
              </p>
              
              <form onSubmit={handleFormSubmit} className="space-y-5">
                {[
                  { id: "name", label: "Full Name", icon: User, type: "text", placeholder: "Enter your full name" },
                  { id: "mobile", label: "Mobile Number", icon: Phone, type: "tel", placeholder: "Enter mobile number" },
                  { id: "email", label: "Email Address", icon: MessageCircle, type: "email", placeholder: "Enter your email" }
                ].map(({ id, label, icon: Icon, type, placeholder }) => (
                  <div key={id} className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-400 ml-1 uppercase tracking-wider">{label}</label>
                    <div className="relative group">
                      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-primary transition-colors" />
                      <input
                        type={type}
                        required
                        placeholder={placeholder}
                        value={formData[id as keyof FormState]}
                        onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-foreground placeholder:text-neutral-600 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 space-y-4">
                  <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
                    Proceed to Payment <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep("home")}
                    className="w-full py-4 rounded-2xl font-bold text-neutral-400 hover:text-neutral-200 transition-colors uppercase tracking-widest text-sm"
                  >
                    ← Go Back
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto py-12 text-center"
            >
              <h2 className="text-3xl font-black mb-1 tracking-tight">Complete Payment</h2>
              <p className="text-neutral-400 text-sm mb-8 font-medium">
                Scan QR or click pay button for <span className="text-primary font-bold">₹{selectedProject.fee}</span>
              </p>
              
              <div className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 mb-8 flex flex-col items-center gap-6 shadow-2xl">
                <div className="text-4xl font-black text-primary tracking-tighter">₹{selectedProject.fee}</div>
                
                <div className="bg-white p-6 rounded-[2rem] shadow-inner relative overflow-hidden">
                  {upiId ? (
                    <img src={qrApiUrl} alt="Payment QR" className="w-48 h-48 block" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-xs font-bold leading-relaxed px-4">
                      Generating Payment QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-black text-neutral-300 uppercase tracking-widest">Scan & Pay Registration Fee</p>
                  <p className="text-xs font-serif italic text-neutral-500">Secure UPI Interface Connected</p>
                </div>

                {upiId && (
                  <div className="w-full py-3 px-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex justify-between items-center group">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-tighter">UPI ID:</span>
                    <span className="text-sm font-mono font-bold text-primary">{upiId}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <a 
                  href={upiId ? upiUrl : "#"}
                  onClick={e => !upiId && e.preventDefault()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-2xl shadow-lg transition-all block text-center uppercase tracking-wider disabled:opacity-50"
                >
                  Pay via UPI App 📱
                </a>
                <button 
                  onClick={() => setStep("utr")}
                  className="w-full py-4 border-2 border-primary/50 text-primary hover:bg-primary/10 font-black rounded-2xl transition-all uppercase tracking-wider"
                >
                  ✅ I Have Paid
                </button>
                <button 
                  onClick={() => setStep("home")}
                  className="w-full text-neutral-500 hover:text-neutral-300 font-bold uppercase tracking-widest text-xs"
                >
                  Change Project
                </button>
              </div>
            </motion.div>
          )}

          {step === "utr" && (
            <motion.div 
              key="utr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto py-12 text-center"
            >
              <h2 className="text-3xl font-black mb-1 tracking-tight">Submit UTR</h2>
              <p className="text-neutral-400 text-sm mb-8 font-medium">Verify your payment to activate work</p>
              
              <div className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 text-left space-y-6 shadow-2xl">
                <div className="space-y-2">
                  <label className="text-sm font-black text-neutral-400 ml-1 uppercase tracking-wider">Transaction ID / UTR Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 12-digit UTR No."
                    value={utr}
                    onChange={(e) => {
                      setUtr(e.target.value);
                      setUtrError("");
                    }}
                    className="w-full px-6 py-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-foreground placeholder:text-neutral-700 focus:ring-2 focus:ring-primary font-mono text-lg transition-all"
                  />
                  {utrError && <p className="text-xs text-red-500 font-bold ml-1">{utrError}</p>}
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800/50">
                  <p className="text-[10px] text-neutral-500 font-bold leading-relaxed uppercase tracking-widest">
                    ℹ️ Check your payment app (GPay/PhonePe/Paytm) history for the 12-digit UTR or Transaction ID.
                  </p>
                </div>

                <button 
                  disabled={!utr.trim() || isSubmitting}
                  onClick={handleUtrSubmit}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-neutral-800 disabled:text-neutral-600 text-primary-foreground font-black py-4 rounded-2xl shadow-lg transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? "Verifying..." : "Submit Transaction ✅"}
                </button>
              </div>

              <button 
                onClick={() => setStep("payment")}
                className="mt-6 w-full text-neutral-500 hover:text-neutral-300 font-bold uppercase tracking-widest text-xs"
              >
                ← Back to QR Code
              </button>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto py-16 text-center"
            >
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CircleCheckBig className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tight text-white">Project Assigned!</h2>
              <p className="text-neutral-400 mb-8 font-medium">Your registration is successful.</p>
              
              <div className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Application ID</p>
                <p className="text-3xl font-mono font-black text-primary tracking-wider">{applicationId}</p>
              </div>

              <div className="p-6 rounded-3xl border-2 border-yellow-500/30 bg-yellow-500/5 text-left mb-8 space-y-4 shadow-[0_0_40px_rgba(234,179,8,0.05)]">
                <h3 className="text-lg font-black text-yellow-500 flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-yellow-500" /> IMPORTANT NOTICE
                </h3>
                <div className="space-y-3 text-sm text-neutral-300 font-medium leading-relaxed">
                  <p>Payment has been recorded. To start your work and receive your first book parcel:</p>
                  <p className="text-yellow-500/90 font-bold">⚠️ You must contact our WhatsApp admin instantly for approval.</p>
                  <p className="text-yellow-500/90 font-bold">⚠️ Delay may lead to registration cancellation.</p>
                </div>
              </div>

              <div className="space-y-4">
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=Hi%20I%20have%20completed%20payment.%20Application%20ID:%20${applicationId}.%20Please%20approve%20my%20work.`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20bd5c] text-white font-black py-5 rounded-[2rem] shadow-xl transition-all block text-center uppercase tracking-widest text-sm"
                >
                  Contact WhatsApp Admin 🚀
                </a>
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                  📲 Parcel details will be shared on WhatsApp
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="max-w-4xl mx-auto px-4 py-20 text-center border-t border-neutral-900 text-neutral-600">
        <p className="text-sm font-bold uppercase tracking-widest">© 2024 HELP WORK PVT LTD</p>
        <p className="text-xs mt-2 font-medium">Affiliated with Digital India Mission</p>
      </footer>
    </div>
  );
}
