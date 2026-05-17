import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, onValue } from "firebase/database";
import { 
  Settings, Save, Plus, Minus, Power, Activity, 
  PlaySquare, Square, Biohazard, Leaf 
} from "lucide-react";

const AdminPanel = () => {
  // Base Anchor Values
  const [manualData, setManualData] = useState({
    waterLevel: 12.0,
    ph: 7.0,
    temp: 25.0,
    tds: 220,
  });

  const [demoMode, setDemoMode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [message, setMessage] = useState("");

  // Check Demo Mode Status from Firebase
  useEffect(() => {
    const demoRef = ref(db, "demoMode");
    const unsubscribe = onValue(demoRef, (snapshot) => {
      const mode = snapshot.val() || false;
      setDemoMode(mode);
      if (!mode) setIsSimulating(false); // Auto stop simulation if demo is turned off
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // JITTER ENGINE (Wandering Range Logic)
  // ==========================================
  const applyJitter = (anchor, type) => {
    let min, max, val;
    switch (type) {
      case 'temp':
        // Window size randomly between 1 and 2
        const windowSize = 1 + Math.random(); 
        min = anchor - windowSize;
        max = anchor + windowSize;
        val = min + Math.random() * (max - min);
        return Number(val.toFixed(1));
      
      case 'ph':
        // Fixed ±0.5 window, 1 decimal
        min = anchor - 0.5;
        max = anchor + 0.5;
        val = min + Math.random() * (max - min);
        return Number(val.toFixed(1));
      
      case 'tds':
        // Fixed ±5 window, whole integer
        min = anchor - 5;
        max = anchor + 5;
        return Math.round(min + Math.random() * (max - min));
      
      case 'waterLevel':
        // Fixed ±0.2 window, 1 decimal
        min = anchor - 0.2;
        max = anchor + 0.2;
        val = min + Math.random() * (max - min);
        return Number(val.toFixed(1));
        
      default:
        return anchor;
    }
  };

  // ==========================================
  // SIMULATION TICKER (Runs every 2 seconds)
  // ==========================================
  useEffect(() => {
    let interval;
    if (isSimulating && demoMode) {
      interval = setInterval(() => {
        const jitteredData = {
          waterLevel: applyJitter(manualData.waterLevel, 'waterLevel'),
          ph: applyJitter(manualData.ph, 'ph'),
          temp: applyJitter(manualData.temp, 'temp'),
          tds: applyJitter(manualData.tds, 'tds')
        };
        set(ref(db, "fake"), jitteredData);
      }, 2000); // 2 Seconds Tick
    }
    return () => clearInterval(interval);
  }, [isSimulating, manualData, demoMode]);

  // Handle Tap adjustments
  const adjustValue = (name, step) => {
    setManualData((prev) => ({
      ...prev,
      [name]: Number((prev[name] + step).toFixed(2)),
    }));
  };

  // Push single static data
  const handleSingleUpdate = async () => {
    try {
      await set(ref(db, "fake"), {
        waterLevel: manualData.waterLevel,
        ph: manualData.ph,
        temp: manualData.temp,
        tds: manualData.tds,
      });
      setMessage("✅ Single Data Pushed!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating data: ", error);
    }
  };

  const toggleDemoMode = async () => {
    await set(ref(db, "demoMode"), !demoMode);
  };

  const toggleSimulation = () => {
    if (!demoMode && !isSimulating) {
      // Auto turn on Demo Mode if user tries to start simulation
      set(ref(db, "demoMode"), true);
    }
    setIsSimulating(!isSimulating);
  };

  // ==========================================
  // SCENARIO SHORTCUTS (Pollution & Recovery)
  // ==========================================
  const triggerPollution = () => {
    setManualData({ waterLevel: 8.0, ph: 5.5, temp: 33.5, tds: 880 });
    if (!isSimulating) toggleSimulation(); // Start simulating the pollution
  };

  const triggerRecovery = () => {
    setManualData({ waterLevel: 12.0, ph: 7.0, temp: 25.0, tds: 220 });
    if (!isSimulating) toggleSimulation(); // Start simulating the recovery
  };

  const ControlCard = ({ label, name, value, step, unit }) => (
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-white tracking-wide">
          {value} <span className="text-sm text-slate-500 font-normal">{unit}</span>
        </p>
      </div>
      <div className="flex items-center gap-3 bg-slate-800 p-1.5 rounded-lg border border-slate-600">
        <button onClick={() => adjustValue(name, -step)} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white p-3 rounded-md transition-all active:scale-95">
          <Minus size={20} strokeWidth={3} />
        </button>
        <button onClick={() => adjustValue(name, step)} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white p-3 rounded-md transition-all active:scale-95">
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 flex justify-center items-center font-sans pb-10">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Settings size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Controller</h2>
          </div>
          
          <button 
            onClick={toggleDemoMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg border ${
              demoMode ? "bg-purple-600/90 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse" : "bg-slate-700 text-slate-300 border-slate-500 hover:bg-slate-600"
            }`}
          >
            <Power size={18} />
            {demoMode ? "DEMO MODE ON" : "DEMO OFF"}
          </button>
        </div>

        {/* Live Simulation Engine Toggle */}
        <div className={`p-5 rounded-xl mb-6 border transition-all flex items-center justify-between ${
          isSimulating ? "bg-green-900/30 border-green-500/50 shadow-inner" : "bg-slate-900 border-slate-700"
        }`}>
          <div>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${isSimulating ? "text-green-400" : "text-slate-300"}`}>
              <Activity className={isSimulating ? "animate-pulse" : ""} size={20} />
              Jitter Engine (Live)
            </h3>
            <p className="text-sm text-slate-400 mt-1">Applies wandering jitter to anchors.</p>
          </div>
          <button 
            onClick={toggleSimulation}
            className={`px-5 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isSimulating ? "bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white" : "bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white"
            }`}
          >
            {isSimulating ? <><Square size={18} /> STOP</> : <><PlaySquare size={18} /> START</>}
          </button>
        </div>

        {/* Scenarios (Pollution / Recovery) */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={triggerPollution} className="bg-orange-900/40 hover:bg-orange-900/60 border border-orange-500/50 text-orange-300 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            <Biohazard size={18} /> Pollution
          </button>
          <button onClick={triggerRecovery} className="bg-teal-900/40 hover:bg-teal-900/60 border border-teal-500/50 text-teal-300 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            <Leaf size={18} /> Recovery
          </button>
        </div>

        {/* Anchors Controllers */}
        <div className="space-y-4 mb-8 relative">
          {/* Overlay to show simulation is running automatically */}
          {isSimulating && (
            <div className="absolute -left-2 -right-2 -top-2 -bottom-2 border-2 border-green-500/30 rounded-2xl pointer-events-none animate-pulse z-10" />
          )}
          <ControlCard label="Anchor: Level (Distance)" name="waterLevel" value={manualData.waterLevel} step={0.5} unit="cm" />
          <ControlCard label="Anchor: pH Level" name="ph" value={manualData.ph} step={0.1} unit="" />
          <ControlCard label="Anchor: Temp" name="temp" value={manualData.temp} step={0.5} unit="°C" />
          <ControlCard label="Anchor: TDS" name="tds" value={manualData.tds} step={10} unit="ppm" />
        </div>

        {/* Manual Push Button (Hidden if simulating) */}
        {!isSimulating && (
          <button 
            onClick={handleSingleUpdate} 
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95 text-lg border border-slate-500"
          >
            <Save size={24} /> Push Static Data
          </button>
        )}

        {message && (
          <div className="mt-5 p-4 bg-green-900/40 border border-green-500/50 rounded-xl text-center text-green-300 font-semibold shadow-inner">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;