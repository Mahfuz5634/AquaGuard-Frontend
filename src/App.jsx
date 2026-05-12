import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set, query, limitToLast } from "firebase/database";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Droplets, Thermometer, Activity, Power, Cpu, Fish, Wind,
  Wifi, Clock, ShieldCheck, TrendingUp, TrendingDown,
  BatteryMedium, SignalHigh, Database, Waves, HeartPulse, AlertCircle, CheckCircle2
} from "lucide-react";

const Dashboard = () => {
  // Real-time IoT Sensor Data & Trends
  const [currentData, setCurrentData] = useState({
    waterLevel: { value: 0, trend: "0%", isUp: false, distance: "0cm" },
    ph: { value: 0, trend: "0", isUp: false },
    temp: { value: 0, trend: "0°C", isUp: false },
    tds: { value: 0, trend: "0 ppm", isUp: false },
    feedHopper: 0,
  });

  const [relays, setRelays] = useState({
    aerator: true,
    waterPump: false,
  });

  const [historyData, setHistoryData] = useState([
    { time: "10:00", ph: 7.2, temp: 26.0, level: 85 },
    { time: "10:15", ph: 7.3, temp: 26.2, level: 84 },
    { time: "10:30", ph: 7.4, temp: 26.5, level: 83 },
    { time: "10:45", ph: 7.3, temp: 26.7, level: 82 },
    { time: "11:00", ph: 7.4, temp: 26.8, level: 82 },
  ]);

  useEffect(() => {
    // 1. Fetch Sensor Data
    const sensorRef = ref(db, "sensor");
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentData({
          waterLevel: {
            value: data.waterLevel || 0,
            trend: data.waterTrend || "0%",
            isUp: data.waterIsUp || false,
            distance: data.distance || "0cm"
          },
          ph: {
            value: data.ph || 0,
            trend: data.phTrend || "0",
            isUp: data.phIsUp || false
          },
          temp: {
            value: data.temp || 0,
            trend: data.tempTrend || "0°C",
            isUp: data.tempIsUp || false
          },
          tds: {
            value: data.tds || 0,
            trend: data.tdsTrend || "0 ppm",
            isUp: data.tdsIsUp || false
          },
          feedHopper: data.feedHopper || 0
        });
      }
    });

    // 2. Fetch Relay Data
    const relaysRef = ref(db, "relays");
    const unsubscribeRelays = onValue(relaysRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setRelays(data);
    });

    // 3. Fetch History Data
    const historyRef = query(ref(db, "history"), limitToLast(8));
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedHistory = Object.values(data).map(item => ({
          time: item.time || "00:00",
          ph: item.ph || 0,
          temp: item.temp || 0,
          level: item.level || 0,
        }));
        setHistoryData(formattedHistory);
      }
    });

    return () => {
      unsubscribeSensor();
      unsubscribeRelays();
      unsubscribeHistory();
    };
  }, []);

  const toggleRelay = async (relay) => {
    const newState = !relays[relay];
    setRelays((prev) => ({ ...prev, [relay]: newState }));
    await set(ref(db, `relays/${relay}`), newState);
  };

  // Pond Health Logic ---
  const calculateHealth = () => {
    let score = 100;
    let issues = [];
    const { ph, temp, tds } = currentData;

    if (ph.value < 6.5 || ph.value > 8.5) { score -= 20; issues.push("Abnormal pH Level"); }
    if (temp.value < 22 || temp.value > 32) { score -= 20; issues.push("Critical Temperature"); }
    if (tds.value > 800) { score -= 15; issues.push("High TDS / Water Impure"); }

    let status = "Optimal";
    let color = "text-emerald-400";
    let bgColor = "bg-emerald-500/10 border-emerald-500/20";

    if (score < 70) { status = "Warning"; color = "text-amber-400"; bgColor = "bg-amber-500/10 border-amber-500/20"; }
    if (score < 50) { status = "Critical"; color = "text-rose-400"; bgColor = "bg-rose-500/10 border-rose-500/20"; }

    return { score, issues, status, color, bgColor };
  };

  const health = calculateHealth();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/*BACKGROUND EFFECTS*/}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        {/*HEADER */}
        <div className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-xl group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-[#0b1221] p-3.5 rounded-xl border border-white/10 shadow-2xl">
                <ShieldCheck className="text-blue-400" size={32} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">AquaGuard</h1>
                <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Node Active
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
                <Database size={14} /> Ultrasonic & Quality Telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg">
              <SignalHigh size={16} className="text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase leading-tight">WiFi Ping</span>
                <span className="text-xs font-mono text-slate-300 font-bold leading-tight">28ms</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg">
              <Clock size={16} className="text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase leading-tight">Uptime</span>
                <span className="text-xs font-mono text-slate-300 font-bold leading-tight">14d 6h</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg">
              <Cpu size={16} className="text-purple-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase leading-tight">Controller</span>
                <span className="text-xs font-mono text-slate-300 font-bold leading-tight">ESP32 Core</span>
              </div>
            </div>
          </div>
        </div>

        {/*SENSOR METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {/* Water Level */}
          <div className="bg-[#0b1221]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-cyan-500/30 hover:bg-[#0b1221] transition-all group relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                <Waves size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${currentData.waterLevel.isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                {currentData.waterLevel.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {currentData.waterLevel.trend}
              </div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-1">Tank Capacity</p>
                <span className="text-[10px] font-mono text-cyan-500/70 border border-cyan-500/20 px-1.5 rounded bg-cyan-500/5">Sonar: {currentData.waterLevel.distance}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-4xl font-black text-white tracking-tighter">{currentData.waterLevel.value}</h2>
                <span className="text-slate-500 font-medium">%</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1.5 bg-cyan-500/20 w-full">
              <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${currentData.waterLevel.value}%` }}></div>
            </div>
          </div>

          {/* pH Level */}
          <div className="bg-[#0b1221]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-purple-500/30 hover:bg-[#0b1221] transition-all group relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                <Activity size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${currentData.ph.isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                {currentData.ph.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {currentData.ph.trend}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-1">Water pH</p>
              <h2 className="text-4xl font-black text-white tracking-tighter mt-1">{currentData.ph.value}</h2>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-purple-500/20 w-full">
              <div className="h-full bg-purple-500 w-[60%] shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-[#0b1221]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-rose-500/30 hover:bg-[#0b1221] transition-all group relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                <Thermometer size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${currentData.temp.isUp ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"}`}>
                {currentData.temp.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {currentData.temp.trend}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-1">Temperature</p>
              <div className="flex items-baseline gap-1 mt-1">
                <h2 className="text-4xl font-black text-white tracking-tighter">{currentData.temp.value}</h2>
                <span className="text-rose-400 text-2xl font-bold">°C</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-rose-500/20 w-full">
              <div className="h-full bg-rose-500 w-[75%] shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
            </div>
          </div>

          {/* TDS Purity */}
          <div className="bg-[#0b1221]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 hover:bg-[#0b1221] transition-all group relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                <Droplets size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${currentData.tds.isUp ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {currentData.tds.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {currentData.tds.trend}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-1">Total Dissolved Solids</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-4xl font-black text-white tracking-tighter">{currentData.tds.value}</h2>
                <span className="text-slate-500 font-medium">PPM</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 w-full">
              <div className="h-full bg-blue-500 w-[40%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>
        </div>

        {/* POND HEALTH LAYOUT*/}
        <div className={`mb-6 bg-[#0b1221]/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border ${health.bgColor} shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all`}>
          <div className="flex items-center gap-6 w-full md:w-auto">
            {/* Circular Score */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * health.score) / 100} className={`${health.color} transition-all duration-1000`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white leading-none">{health.score}</span>
              </div>
            </div>
            {/* Health Text */}
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <HeartPulse size={14} className={health.color} /> AI System Assessment
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Pond Health:</span>
                <span className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${health.color}`}>{health.status}</span>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="w-full md:w-auto flex-grow max-w-md bg-black/30 rounded-xl p-3 border border-white/5">
            {health.issues.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] text-white/50 font-bold uppercase flex items-center gap-1"><AlertCircle size={12}/> Attention Required</p>
                {health.issues.map((issue, i) => (
                  <span key={i} className="text-xs font-mono text-rose-300 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 w-fit">• {issue}</span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 h-full">
                <CheckCircle2 size={20} />
                <span className="text-sm font-bold uppercase">All Parameters Optimal</span>
              </div>
            )}
          </div>
        </div>

      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Telemetry Chart */}
          <div className="bg-[#0b1221]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/5 lg:col-span-2 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <Activity size={20} className="text-blue-400" /> Sensor Telemetry Map
                </h3>
              </div>
              <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                <button className="px-5 py-1.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/20">Live</button>
                <button className="px-5 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">1H</button>
                <button className="px-5 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">24H</button>
              </div>
            </div>

            <div className="h-[300px] sm:h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} domain={["dataMin - 5", "dataMax + 5"]} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }} itemStyle={{ fontSize: "14px", fontWeight: "bold" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "13px", paddingTop: "15px" }} />
                  <Area yAxisId="left" type="monotone" dataKey="level" stroke="#06b6d4" strokeWidth={3} fill="url(#colorLevel)" name="Water Level (%)" activeDot={{ r: 6, fill: "#06b6d4", stroke: "#020617", strokeWidth: 2 }} />
                  <Area yAxisId="right" type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={3} fill="url(#colorTemp)" name="Water Temp (°C)" activeDot={{ r: 6, fill: "#f43f5e", stroke: "#020617", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actuator Control Panel*/}
          <div className="bg-[#0b1221]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/5 flex flex-col shadow-2xl relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white tracking-wide">Actuator Control</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Direct hardware override</p>
            </div>

            <div className="space-y-4 flex-grow z-10">
              {/* Aerator Relay */}
              <div className={`relative p-5 rounded-2xl border transition-all duration-300 ${relays.aerator ? "bg-cyan-500/5 border-cyan-500/30" : "bg-black/20 border-white/5"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${relays.aerator ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]" : "bg-white/5 text-slate-400"}`}>
                      <Wind size={20} className={relays.aerator ? "animate-spin-slow" : ""} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm">Paddlewheel Aerator</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Relay_1 [220V]</p>
                    </div>
                  </div>
                  
                  {/*Toggle Switch */}
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${relays.aerator ? "text-cyan-400" : "text-slate-500"}`}>{relays.aerator ? "ON" : "OFF"}</span>
                    <button onClick={() => toggleRelay("aerator")} className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${relays.aerator ? "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "bg-white/10"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${relays.aerator ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pump Relay */}
              <div className={`relative p-5 rounded-2xl border transition-all duration-300 ${relays.waterPump ? "bg-blue-500/5 border-blue-500/30" : "bg-black/20 border-white/5"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${relays.waterPump ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]" : "bg-white/5 text-slate-400"}`}>
                      <Power size={20} className={relays.waterPump ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm">Exchange Pump</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Relay_2 [12V]</p>
                    </div>
                  </div>
                  
                  {/* Improved Toggle Switch */}
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${relays.waterPump ? "text-blue-400" : "text-slate-500"}`}>{relays.waterPump ? "ON" : "OFF"}</span>
                    <button onClick={() => toggleRelay("waterPump")} className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${relays.waterPump ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "bg-white/10"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${relays.waterPump ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Feeder Control (Unchanged) */}
            <div className="mt-6 pt-6 border-t border-white/10 z-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Feed Hopper</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{currentData.feedHopper}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2.5 mb-5 border border-white/5">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${currentData.feedHopper}%` }}></div>
              </div>

              <button className="group w-full relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-400/50">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <Fish size={18} className="group-hover:scale-125 transition-transform duration-300" /> TRIGGER SERVO FEEDER
                </span>
              </button>
              <div className="flex justify-between items-center mt-3 px-1">
                <p className="text-[10px] text-slate-500 font-mono uppercase">Last: 12:00 PM</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase">Next: 18:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;