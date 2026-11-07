"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { anyApi } from "convex/server";
import {
  Building2,
  Bus,
  MapPin,
  CreditCard,
  Users,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Search,
  ChevronDown,
  TrendingUp,
  Clock,
  Sparkles,
  Plus,
  X,
  AlertTriangle,
  ShieldCheck,
  Check
} from "lucide-react";

const AVAILABLE_AMENITIES = [
  "Air Conditioning",
  "High-speed Wi-Fi",
  "USB Charging Point",
  "Fresh Blanket & Pillow",
  "Complimentary Water",
  "Personal Reading Light",
  "Live GPS Tracking",
  "Emergency Exit",
  "24/7 CCTV Surveillance",
];

export default function OperatorPortalPage() {
  const operators = useQuery((anyApi as any).operators.listAllOperators, {}) as any[] || [];
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");

  // Default to first operator once loaded
  const currentOp = operators.find((o) => o._id === selectedOperatorId) || operators[0];

  const operatorMetrics = useQuery(
    (anyApi as any).reports.getOperatorMetrics,
    currentOp ? { operatorId: currentOp._id } : "skip"
  ) as any;

  const operatorBuses = useQuery(
    (anyApi as any).buses.listOperatorBuses,
    currentOp ? { operatorId: currentOp._id } : "skip"
  ) as any[] || [];

  const operatorSettlements = useQuery(
    (anyApi as any).settlements.getOperatorSettlements,
    currentOp ? { operatorId: currentOp._id } : "skip"
  ) as any[] || [];

  const createBusMutation = useMutation((anyApi as any).buses.createBus);

  const [activeTab, setActiveTab] = useState<"fleet" | "trips" | "settlements">("fleet");

  // Bus Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [busForm, setBusForm] = useState({
    busNumber: "",
    name: "",
    busType: "AC Sleeper (2+1)" as any,
    category: "sleeper" as any,
    isAc: true,
    totalSeats: 30,
    hasUpperDeck: true,
    amenities: ["Air Conditioning", "USB Charging Point", "Live GPS Tracking"],
  });
  const [busSubmitLoading, setBusSubmitLoading] = useState(false);
  const [busSubmitSuccess, setBusSubmitSuccess] = useState<string | null>(null);
  const [busSubmitError, setBusSubmitError] = useState<string | null>(null);

  const handleAmenityToggle = (amenity: string) => {
    setBusForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleRegisterBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOp) return;
    setBusSubmitLoading(true);
    setBusSubmitError(null);
    setBusSubmitSuccess(null);

    try {
      await createBusMutation({
        token: "demo-operator-token",
        operatorId: currentOp._id,
        busNumber: busForm.busNumber.trim().toUpperCase(),
        name: busForm.name.trim(),
        busType: busForm.busType,
        category: busForm.category,
        isAc: busForm.isAc,
        totalSeats: Number(busForm.totalSeats),
        hasUpperDeck: busForm.hasUpperDeck,
        amenities: busForm.amenities,
        images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800"],
      });
      setBusSubmitSuccess(`Bus ${busForm.busNumber.toUpperCase()} registered successfully!`);
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setBusSubmitSuccess(null);
        setBusForm({
          busNumber: "",
          name: "",
          busType: "AC Sleeper (2+1)",
          category: "sleeper",
          isAc: true,
          totalSeats: 30,
          hasUpperDeck: true,
          amenities: ["Air Conditioning", "USB Charging Point", "Live GPS Tracking"],
        });
      }, 1500);
    } catch (err: any) {
      setBusSubmitError(err.message || "Failed to register bus. Please verify fields.");
    } finally {
      setBusSubmitLoading(false);
    }
  };

  const isOperatorPending = currentOp && (currentOp.status === "PENDING" || currentOp.status === "UNDER_REVIEW");

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      {/* Top Header */}
      <header className="bg-[#101B35] text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7547] to-[#FFA07A] flex items-center justify-center font-bold text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none text-white">Tripzo Operator Portal</h1>
                <span className="text-[11px] text-slate-400">Bus Company Fleet & Operations</span>
              </div>
            </div>
          </div>

          {/* Operator Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={currentOp ? currentOp._id : ""}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-white/20 focus:outline-none focus:border-[#FF7547] transition-colors"
              >
                {operators.map((op) => (
                  <option key={op._id} value={op._id} className="bg-[#101B35] text-white">
                    {op.companyName} ({op.city})
                  </option>
                ))}
              </select>
            </div>
            <Link
              href="/admin"
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
            >
              Super Admin →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {currentOp && (
          <div className="space-y-8">
            {/* Operator Company Hero Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#101B35] to-[#1E2F5B] flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {currentOp.companyName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-[#101B35]">{currentOp.companyName}</h2>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                        isOperatorPending
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isOperatorPending ? "PENDING APPROVAL" : "VERIFIED OPERATOR"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    HQ: {currentOp.officeAddress}, {currentOp.city}, {currentOp.state} • GSTIN: {currentOp.gstin || "29AAACP1234Z1Z5"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-slate-400 block text-[10px]">Commission</span>
                  <span className="font-bold text-[#FF7547] text-sm">{currentOp.commissionRate}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-slate-400 block text-[10px]">Net Payout</span>
                  <span className="font-bold text-emerald-600 text-sm">90.0%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-slate-400 block text-[10px]">Settlement</span>
                  <span className="font-bold text-slate-800 text-sm">T+1 Razorpay</span>
                </div>
              </div>
            </div>

            {/* Approval Notice Banner */}
            {isOperatorPending ? (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-amber-900 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block text-sm mb-1 text-amber-950">Registration Pending Super Admin Approval</span>
                  Your company registration has been received and is currently under compliance review. Tripzo Super Admin must approve your application before you can register new fleet buses or publish live passenger booking schedules.
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950">Account Active & Approved: </span>
                    You are authorized to register fleet buses, manage layouts, and receive automated T+1 settlements.
                  </div>
                </div>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#101B35] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4 text-[#FF7547]" /> Register New Bus
                </button>
              </div>
            )}

            {/* Operator KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">Active Fleet</span>
                <span className="text-2xl font-black text-[#101B35]">{operatorBuses.length} Buses</span>
                <span className="text-[11px] text-emerald-600 block mt-1">Multi-Axle & Sleeper</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">Gross Ticket Sales</span>
                <span className="text-2xl font-black text-slate-800">
                  ₹{operatorMetrics ? operatorMetrics.totalRevenue.toLocaleString("en-IN") : "0"}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">Customer bookings</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">Tripzo Fee (10%)</span>
                <span className="text-2xl font-black text-[#FF7547]">
                  ₹{operatorMetrics ? operatorMetrics.totalCommissionDeducted.toLocaleString("en-IN") : "0"}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">Platform service fee</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">Net Payable To Bank</span>
                <span className="text-2xl font-black text-emerald-600">
                  ₹{operatorMetrics ? operatorMetrics.netPayout.toLocaleString("en-IN") : "0"}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">Direct Bank Credit</span>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab("fleet")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === "fleet"
                    ? "bg-[#101B35] text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                Fleet Vehicles ({operatorBuses.length})
              </button>
              <button
                onClick={() => setActiveTab("settlements")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === "settlements"
                    ? "bg-[#101B35] text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                Settlement History
              </button>
            </div>

            {/* TAB: FLEET */}
            {activeTab === "fleet" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="font-bold text-[#101B35] text-base">Fleet Inventory</h3>
                    <p className="text-xs text-slate-500">Manage all registered coaches, seating capacity, and onboard amenities.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (isOperatorPending) {
                        alert("Account is pending Admin approval. You will be able to register buses as soon as Tripzo Admin verifies your account.");
                        return;
                      }
                      setIsRegisterModalOpen(true);
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                      isOperatorPending
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#FF7547] hover:bg-[#F06233] text-white"
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Register New Bus
                  </button>
                </div>

                {operatorBuses.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <Bus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-700 text-sm mb-1">No Buses Registered Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                      Add your first coach (Volvo, Scania, BharatBenz) to begin operating routes and receiving bookings on Tripzo.
                    </p>
                    <button
                      onClick={() => {
                        if (isOperatorPending) {
                          alert("Account is pending Admin approval.");
                          return;
                        }
                        setIsRegisterModalOpen(true);
                      }}
                      disabled={isOperatorPending}
                      className="px-5 py-2.5 rounded-xl bg-[#101B35] text-white text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-[#FF7547]" /> Register Bus Now
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6">
                    {operatorBuses.map((bus) => (
                      <div key={bus._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">
                            {bus.busNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {bus.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-[#101B35] text-base mb-1">{bus.name}</h4>
                        <p className="text-xs text-slate-500 mb-3">{bus.busType}</p>
                        <div className="text-xs text-slate-600 space-y-1 mb-4">
                          <div>Total Seats: <span className="font-bold text-slate-800">{bus.totalSeats} Berths</span></div>
                          <div>Layout: <span className="font-semibold text-slate-700">{bus.hasUpperDeck ? "Lower + Upper Deck (2+1)" : "Single Deck Seater"}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {bus.amenities.map((am: string, i: number) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SETTLEMENTS */}
            {activeTab === "settlements" && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Booking / PNR</th>
                      <th className="px-6 py-4">Gross Fare</th>
                      <th className="px-6 py-4">Tripzo Commission (10%)</th>
                      <th className="px-6 py-4">Net Operator Share</th>
                      <th className="px-6 py-4">Transfer Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {operatorSettlements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No settlements yet for {currentOp.companyName}.
                        </td>
                      </tr>
                    ) : (
                      operatorSettlements.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#101B35]">{s.pnr}</td>
                          <td className="px-6 py-4">₹{s.grossAmount}</td>
                          <td className="px-6 py-4 text-[#FF7547] font-semibold">-₹{s.commissionAmount}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">₹{s.netPayableAmount}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register New Bus Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#101B35]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute right-6 top-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7547] to-[#FFA07A] text-white flex items-center justify-center font-bold">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#101B35]">Register New Fleet Bus</h3>
                <p className="text-xs text-slate-500">Add a coach to {currentOp?.companyName} to publish on Tripzo routes.</p>
              </div>
            </div>

            {busSubmitSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {busSubmitSuccess}
              </div>
            )}

            {busSubmitError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                {busSubmitError}
              </div>
            )}

            <form onSubmit={handleRegisterBusSubmit} className="space-y-5 text-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Bus Name / Service</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VRL I-Shift Multi-Axle Volvo"
                    value={busForm.name}
                    onChange={(e) => setBusForm({ ...busForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FF7547]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Vehicle Registration (Number Plate)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA 25 F 9876"
                    value={busForm.busNumber}
                    onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold focus:outline-none focus:border-[#FF7547]"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Bus Model / Type</label>
                  <select
                    value={busForm.busType}
                    onChange={(e) => setBusForm({ ...busForm, busType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-[#FF7547]"
                  >
                    <option value="AC Sleeper (2+1)">AC Sleeper (2+1)</option>
                    <option value="Volvo Multi-Axle AC">Volvo Multi-Axle AC</option>
                    <option value="Scania Multi-Axle Sleeper">Scania Multi-Axle Sleeper</option>
                    <option value="BharatBenz AC Sleeper">BharatBenz AC Sleeper</option>
                    <option value="AC Seater / Sleeper">AC Seater / Sleeper</option>
                    <option value="Non-AC Seater / Sleeper">Non-AC Seater / Sleeper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Seating Category</label>
                  <select
                    value={busForm.category}
                    onChange={(e) => setBusForm({ ...busForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-[#FF7547]"
                  >
                    <option value="sleeper">Sleeper Berths</option>
                    <option value="seater">Push-back Seater</option>
                    <option value="semi-sleeper">Semi-Sleeper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Total Capacity (Seats)</label>
                  <input
                    type="number"
                    min={12}
                    max={60}
                    required
                    value={busForm.totalSeats}
                    onChange={(e) => setBusForm({ ...busForm, totalSeats: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-[#FF7547]"
                  />
                </div>
              </div>

              {/* Deck Layout & AC Config */}
              <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={busForm.hasUpperDeck}
                    onChange={(e) => setBusForm({ ...busForm, hasUpperDeck: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF7547] focus:ring-0"
                  />
                  <span>Has Upper Deck (Lower + Upper Deck 2+1 Layout)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={busForm.isAc}
                    onChange={(e) => setBusForm({ ...busForm, isAc: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF7547] focus:ring-0"
                  />
                  <span>Air Conditioned (AC)</span>
                </label>
              </div>

              {/* Amenities */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Onboard Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_AMENITIES.map((am) => {
                    const selected = busForm.amenities.includes(am);
                    return (
                      <button
                        type="button"
                        key={am}
                        onClick={() => handleAmenityToggle(am)}
                        className={`px-3 py-2 rounded-xl text-left font-semibold border transition-all flex items-center justify-between ${
                          selected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{am}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#FF7547] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busSubmitLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#FF7547] hover:bg-[#F06233] text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-60 shadow-md"
                >
                  {busSubmitLoading ? "Registering Bus..." : "Complete Bus Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
