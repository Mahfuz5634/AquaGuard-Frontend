import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, onValue } from "firebase/database";
import { Settings, Save, Plus, Minus, Power, Activity } from "lucide-react";

const AdminPanel = () => {
  // ডিফল্ট কিছু ভ্যালু সেট করা আছে
  const [manualData, setManualData] = useState({
    waterLevel: 5.5,
    ph: 7.2,
    temp: 28.5,
    tds: 450,
  });

  const [demoMode, setDemoMode] = useState(false);
  const [message, setMessage] = useState("");

  // ফায়ারবেস থেকে ডেমো মোডের বর্তমান অবস্থা চেক করা
  useEffect(() => {
    const demoRef = ref(db, "demoMode");
    const unsubscribe = onValue(demoRef, (snapshot) => {
      setDemoMode(snapshot.val() || false);
    });
    return () => unsubscribe();
  }, []);

  // প্লাস/মাইনাস বাটনে ট্যাপ করলে ভ্যালু চেঞ্জ করার ফাংশন
  const adjustValue = (name, step) => {
    setManualData((prev) => ({
      ...prev,
      [name]: Number((prev[name] + step).toFixed(2)),
    }));
  };

  // ডেমো ডেটা সেভ করা (demoSensor নোডে সেভ হবে, যাতে আসল ডাটা নষ্ট না হয়)
  const handleUpdate = async () => {
    try {
      await set(ref(db, "demoSensor"), {
        waterLevel: manualData.waterLevel,
        ph: manualData.ph,
        temp: manualData.temp,
        tds: manualData.tds,
      });
      setMessage("✅ Dashboard Data Updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating data: ", error);
      setMessage("❌ Error updating data!");
    }
  };

  // ডেমো মোড অন/অফ করার ফাংশন
  const toggleDemoMode = async () => {
    try {
      await set(ref(db, "demoMode"), !demoMode);
    } catch (error) {
      console.error("Error toggling mode: ", error);
    }
  };

  // রিইউজেবল কন্ট্রোলার কম্পোনেন্ট (UI এর জন্য)
  const ControlCard = ({ label, name, value, step, unit }) => (
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
        <p className="text-xl font-bold text-white tracking-wide">
          {value} <span className="text-sm text-slate-500 font-normal">{unit}</span>
        </p>
      </div>
      
      <div className="flex items-center gap-3 bg-slate-800 p-1.5 rounded-lg border border-slate-600">
        <button 
          onClick={() => adjustValue(name, -step)}
          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white p-3 rounded-md transition-all active:scale-95"
        >
          <Minus size={20} strokeWidth={3} />
        </button>
        <button 
          onClick={() => adjustValue(name, step)}
          className="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white p-3 rounded-md transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 flex justify-center items-center font-sans">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-700">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Settings size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Controller</h2>
          </div>
          
          {/* Master Mode Toggle Button */}
          <button 
            onClick={toggleDemoMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg border ${
              demoMode 
              ? "bg-purple-600/90 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse" 
              : "bg-slate-700 text-slate-300 border-slate-500 hover:bg-slate-600"
            }`}
          >
            <Power size={18} />
            {demoMode ? "DEMO MODE ON" : "DEMO MODE OFF"}
          </button>
        </div>

        {/* Info Banner */}
        {demoMode && (
          <div className="bg-purple-900/30 border border-purple-500/50 p-4 rounded-xl mb-6 flex gap-3 items-center shadow-inner">
            <Activity className="text-purple-400 shrink-0" size={24} />
            <p className="text-sm text-purple-200">
              System is currently taking fake data. Use the buttons below to control the Dashboard.
            </p>
          </div>
        )}

        {/* Controllers */}
        <div className="space-y-4 mb-8">
          <ControlCard label="Water Level (Distance)" name="waterLevel" value={manualData.waterLevel} step={0.5} unit="cm" />
          <ControlCard label="Water pH Level" name="ph" value={manualData.ph} step={0.1} unit="" />
          <ControlCard label="Temperature" name="temp" value={manualData.temp} step={0.5} unit="°C" />
          <ControlCard label="Water TDS" name="tds" value={manualData.tds} step={10} unit="ppm" />
        </div>

        {/* Save Button */}
        <button 
          onClick={handleUpdate} 
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 text-lg"
        >
          <Save size={24} />
          Push Data to Dashboard
        </button>

        {/* Success Message */}
        {message && (
          <div className="mt-5 p-4 bg-green-900/40 border border-green-500/50 rounded-xl text-center text-green-300 font-semibold shadow-inner animate-bounce">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;