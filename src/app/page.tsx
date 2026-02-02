import Link from "next/link";
import { Button } from "@/components/ui/button"; [cite_start]// Using your shadcn button [cite: 17]
import { ArrowRight, ShieldCheck, Activity, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">+</div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">PakHealth</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-blue-600">Log In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Now Live in Lahore & Islamabad
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
          Healthcare, <span className="text-blue-600">Simplified.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
          The all-in-one platform for Pakistan. Book appointments, manage medical records, and connect with top specialists—all from your phone.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/register">
            <Button className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 rounded-full w-full sm:w-auto shadow-lg shadow-blue-200">
              Find a Doctor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" className="h-12 px-8 text-lg rounded-full w-full sm:w-auto">
              For Doctors
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<MapPin className="text-blue-600" />}
            title="Smart Location"
            desc="Find clinics and specialists nearest to your home in seconds."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-blue-600" />}
            title="Secure Records"
            desc="Your medical history, prescriptions, and CNIC data are encrypted."
          />
          <FeatureCard 
            icon={<Activity className="text-blue-600" />}
            title="Real-time Tracking"
            desc="Live queue status so you never have to wait in the lobby again."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
