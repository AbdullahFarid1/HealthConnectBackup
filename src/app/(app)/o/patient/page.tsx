"use client";
import { useState } from "react";
import { 
  Search, MapPin, Calendar, Clock, User, Settings, LogOut, 
  ChevronRight, Star, Bell 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("find-doctors");

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* 1. Sidebar Navigation (Fixed) */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed h-full z-10">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 text-2xl font-bold text-blue-600 tracking-tight">
            <span>PakHealth</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Patient</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
          <NavButton icon={<Search />} label="Find Doctors" active={activeTab === "find-doctors"} onClick={() => setActiveTab("find-doctors")} />
          <NavButton icon={<MapPin />} label="Clinics Near Me" active={activeTab === "clinics"} onClick={() => setActiveTab("clinics")} />
          <NavButton icon={<Calendar />} label="Appointments" active={activeTab === "appointments"} onClick={() => setActiveTab("appointments")} />
          <NavButton icon={<Clock />} label="Medical History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
          
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-2">System</p>
          <NavButton icon={<Settings />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area (Scrollable) */}
      <main className="flex-1 lg:ml-72 p-6 lg:p-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold capitalize tracking-tight text-slate-900">{activeTab.replace("-", " ")}</h1>
            <p className="text-slate-500 mt-1">Welcome back, Ali Khan.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
              <Bell size={20} />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
              AK
            </div>
          </div>
        </header>

        {/* Dynamic Content Switching */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === "find-doctors" && (
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search specialists, names, or clinics..." 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Doctor Cards Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                <DoctorCard 
                  name="Dr. Sarah Ahmed" 
                  role="Cardiologist" 
                  hospital="Shifa International" 
                  rating="4.9" 
                  available="Today"
                  imageColor="bg-blue-100 text-blue-600"
                />
                <DoctorCard 
                  name="Dr. Usman Ali" 
                  role="Dentist" 
                  hospital="Blue Area Dental" 
                  rating="4.8" 
                  available="Tomorrow"
                  imageColor="bg-purple-100 text-purple-600"
                />
                <DoctorCard 
                  name="Dr. Bilal Khan" 
                  role="Dermatologist" 
                  hospital="Skin Care Lahore" 
                  rating="4.7" 
                  available="Today"
                  imageColor="bg-green-100 text-green-600"
                />
              </div>
            </div>
          )}

          {activeTab === "clinics" && (
             <div className="h-[500px] w-full rounded-3xl bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500">
                <MapPin size={48} className="mb-4 opacity-50" />
                <p className="font-medium text-lg">Google Maps Integration</p>
                <p className="text-sm">Will display nearest clinics based on GPS</p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}

// --- Sub-Components for Clean Code ---

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]" 
          : "text-slate-600 hover:bg-slate-100 hover:pl-5"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );
}

function DoctorCard({ name, role, hospital, rating, available, imageColor }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className={`h-14 w-14 rounded-2xl ${imageColor} flex items-center justify-center font-bold text-xl`}>
          Dr
        </div>
        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-slate-700">{rating}</span>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{name}</h3>
      <p className="text-sm text-slate-500 font-medium mb-1">{role}</p>
      <div className="flex items-center gap-1 text-xs text-slate-400 mb-6">
        <MapPin size={12} /> {hospital}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
          • {available}
        </span>
        <Button size="sm" className="bg-slate-900 text-white hover:bg-blue-600 rounded-lg transition-colors">
          Book
        </Button>
      </div>
    </div>
  );
}
