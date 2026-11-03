"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
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
  Sparkles
} from "lucide-react";

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

  const [activeTab, setActiveTab] = useState<"fleet" | "trips" | "settlements">("fleet");

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
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      VERIFIED OPERATOR
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
    </div>
  );
}
