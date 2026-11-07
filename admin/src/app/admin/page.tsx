"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { anyApi } from "convex/server";
import {
  ShieldCheck,
  Building2,
  Bus,
  MapPin,
  TrendingUp,
  CreditCard,
  Ticket,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Tag
} from "lucide-react";

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "operators" | "buses" | "routes" | "bookings" | "settlements" | "coupons">("overview");

  // Convex Queries
  const metrics = useQuery((anyApi as any).reports.getSuperAdminMetrics) as any;
  const operators = useQuery((anyApi as any).operators.listAllOperators, {}) as any[] || [];
  const buses = useQuery((anyApi as any).buses.listAllBuses, {}) as any[] || [];
  const routes = useQuery((anyApi as any).buses.listRoutes, {}) as any[] || [];
  const ledger = useQuery((anyApi as any).settlements.getFinancialLedger, { limit: 50 }) as any[] || [];
  const coupons = useQuery((anyApi as any).coupons.listActiveCoupons, {}) as any[] || [];

  // Convex Mutations
  const updateOperatorStatus = useMutation((anyApi as any).operators.updateOperatorStatus);
  const processSettlementTransfer = useMutation((anyApi as any).settlements.processSettlementTransfer);

  const [operatorSearch, setOperatorSearch] = useState("");
  const [busSearch, setBusSearch] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const pendingOperators = operators.filter(
    (o) => o.status === "PENDING" || o.status === "UNDER_REVIEW"
  );

  const handleStatusChange = async (operatorId: any, status: any) => {
    try {
      await updateOperatorStatus({ token: "demo-admin-token", operatorId, status });
      setActionMessage(
        status === "ACTIVE" || status === "APPROVED"
          ? `Operator approved and activated successfully! They can now log in and register buses.`
          : `Operator status updated to ${status}.`
      );
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredOperators = operators.filter((o) =>
    o.companyName.toLowerCase().includes(operatorSearch.toLowerCase()) ||
    o.city.toLowerCase().includes(operatorSearch.toLowerCase())
  );

  const filteredBuses = buses.filter((b) =>
    b.name.toLowerCase().includes(busSearch.toLowerCase()) ||
    b.busNumber.toLowerCase().includes(busSearch.toLowerCase()) ||
    (b.operatorName && b.operatorName.toLowerCase().includes(busSearch.toLowerCase()))
  );

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
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none text-white">Tripzo Super Admin</h1>
                <span className="text-[11px] text-slate-400">Marketplace Executive Console</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Convex Cloud Live
            </span>
            <Link
              href="/operator"
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Operator View →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {actionMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-8 overflow-x-auto">
          {[
            { id: "overview", label: "Executive Overview", icon: TrendingUp },
            {
              id: "operators",
              label:
                pendingOperators.length > 0
                  ? `Operators (${pendingOperators.length} Pending Approval)`
                  : `Operators (${operators.length})`,
              icon: Building2,
            },
            { id: "buses", label: `Fleet Vehicles (${buses.length})`, icon: Bus },
            { id: "routes", label: `Routes (${routes.length})`, icon: MapPin },
            { id: "settlements", label: "Financial Ledger & Payouts", icon: CreditCard },
            { id: "coupons", label: `Coupons (${coupons.length})`, icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? "bg-[#101B35] text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-[#FF7547]" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Gross Booking Value (GBV)</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-[#101B35]">
                  ₹{metrics ? metrics.grossBookingValue.toLocaleString("en-IN") : "0"}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Total passenger ticket sales across all operators</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Platform Commission (10%)</span>
                  <TrendingUp className="w-4 h-4 text-[#FF7547]" />
                </div>
                <div className="text-3xl font-black text-[#FF7547]">
                  ₹{metrics ? metrics.totalPlatformCommission.toLocaleString("en-IN") : "0"}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Net Tripzo earnings from marketplace bookings</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Operator Payables</span>
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-slate-800">
                  ₹{metrics ? metrics.operatorPayableTotal.toLocaleString("en-IN") : "0"}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Net 90% share to bus operator bank accounts</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Total Confirmed Bookings</span>
                  <Ticket className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-3xl font-black text-purple-700">
                  {metrics ? metrics.confirmedBookings : "0"}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Active QR-verified passenger boarding passes</p>
              </div>
            </div>

            {/* Platform Inventory Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#101B35] text-sm">Operator Approvals</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-700">
                    {metrics ? `${metrics.activeOperators} / ${metrics.totalOperators} Active` : "20 Active"}
                  </span>
                </div>
                <div className="space-y-3">
                  {operators.slice(0, 5).map((op) => (
                    <div key={op._id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-bold text-[#101B35]">{op.companyName}</div>
                        <div className="text-slate-400">{op.city}, {op.state}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        op.status === "APPROVED" || op.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {op.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab("operators")}
                  className="w-full mt-4 text-center text-xs font-bold text-[#FF7547] hover:underline"
                >
                  View All 20 Operators →
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#101B35] text-sm">Fleet Breakdown</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-700">
                    {buses.length} Buses
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Volvo Multi-Axle AC</span>
                    <span className="font-bold text-[#101B35]">40 Buses</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Scania Multi-Axle Sleeper</span>
                    <span className="font-bold text-[#101B35]">20 Buses</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">BharatBenz AC Sleeper (2+1)</span>
                    <span className="font-bold text-[#101B35]">20 Buses</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Ashok Leyland Luxura</span>
                    <span className="font-bold text-[#101B35]">20 Buses</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("buses")}
                  className="w-full mt-4 text-center text-xs font-bold text-[#FF7547] hover:underline"
                >
                  View Complete Fleet →
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#101B35] text-sm">Razorpay Route Settlements</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    T+1 Payouts
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Marketplace splits are automated. Each ticket payment is captured in the Tripzo master account and operator shares are queued for settlement.
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Commission Rule:</span>
                    <span className="font-bold text-[#101B35]">10.0% Global</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route Status:</span>
                    <span className="font-bold text-emerald-600">Active & Configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending Transfers:</span>
                    <span className="font-bold text-slate-700">₹{metrics ? metrics.pendingSettlementAmount : "0"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("settlements")}
                  className="w-full mt-4 text-center text-xs font-bold text-[#FF7547] hover:underline"
                >
                  Inspect Financial Ledger →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPERATORS & APPROVALS */}
        {activeTab === "operators" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-[#101B35]">Bus Company Directory & Approvals</h2>
                <p className="text-xs text-slate-500">Review operator registrations, manage statuses, and modify platform commission rates.</p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search operator by name or city..."
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#FF7547]"
                />
              </div>
            </div>

            {/* Pending Operator Approvals Section */}
            {pendingOperators.length > 0 && (
              <div className="bg-amber-50/70 rounded-3xl border border-amber-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#101B35]">
                        Pending Operator Applications ({pendingOperators.length})
                      </h3>
                      <p className="text-xs text-amber-800">
                        These bus companies have submitted KYC and are waiting for Super Admin approval before they can register buses and publish schedules.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {pendingOperators.map((op) => (
                    <div
                      key={op._id}
                      className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-[#101B35] text-sm">{op.companyName}</h4>
                            <p className="text-xs text-slate-500">
                              {op.city}, {op.state} • Contact: {op.contactPerson} ({op.phone})
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            PENDING REVIEW
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl space-y-1 mb-4">
                          <div>
                            Email: <span className="font-semibold text-slate-800">{op.email}</span>
                          </div>
                          <div>
                            GSTIN: <span className="font-semibold text-slate-800">{op.gstin || "In Verification"}</span> • PAN: <span className="font-semibold text-slate-800">{op.pan || "In Verification"}</span>
                          </div>
                          <div>
                            Marketplace Split: <span className="font-bold text-[#FF7547]">10% Tripzo / 90% Operator Net</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleStatusChange(op._id, "ACTIVE")}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve & Activate
                        </button>
                        <button
                          onClick={() => handleStatusChange(op._id, "REJECTED")}
                          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Operator / Company</th>
                      <th className="px-6 py-4">HQ City</th>
                      <th className="px-6 py-4">Fleet Size</th>
                      <th className="px-6 py-4">Commission</th>
                      <th className="px-6 py-4">Rating</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOperators.map((op) => (
                      <tr key={op._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#101B35] text-sm">{op.companyName}</div>
                          <div className="text-slate-400 text-[11px]">{op.email} • {op.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{op.city}, {op.state}</td>
                        <td className="px-6 py-4 text-slate-800 font-bold">{op.totalBuses || 5} Buses</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#FF7547]">{op.commissionRate || 10}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">★ {op.rating}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({op.totalReviews})</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            op.status === "APPROVED" || op.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : op.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {op.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {op.status !== "APPROVED" && op.status !== "ACTIVE" ? (
                              <button
                                onClick={() => handleStatusChange(op._id, "APPROVED")}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                              >
                                Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(op._id, "SUSPENDED")}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-[11px] transition-colors"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FLEET VEHICLES */}
        {activeTab === "buses" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-[#101B35]">Marketplace Fleet Directory (100 Buses)</h2>
                <p className="text-xs text-slate-500">Live inventory of buses across all registered operators.</p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bus name, registration number..."
                  value={busSearch}
                  onChange={(e) => setBusSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#FF7547]"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {filteredBuses.slice(0, 30).map((b) => (
                <div key={b._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                      {b.busNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {b.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#101B35] text-base mb-1">{b.name}</h4>
                  <p className="text-xs text-[#FF7547] font-semibold mb-3">{b.operatorName}</p>
                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <div>Type: <span className="font-semibold text-slate-700">{b.busType}</span></div>
                    <div>Capacity: <span className="font-semibold text-slate-700">{b.totalSeats} Seats</span> ({b.hasUpperDeck ? "Lower + Upper Deck" : "Single Deck"})</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.amenities.slice(0, 4).map((am: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MASTER ROUTES */}
        {activeTab === "routes" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-[#101B35]">50 Master Bus Routes Across India</h2>
              <p className="text-xs text-slate-500 mt-1">High-traffic intercity routes connecting Bengaluru, Hyderabad, Chennai, Goa, Mumbai, Pune, Kalaburagi, and Vijayawada.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {routes.map((r) => (
                <div key={r._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7547] flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#101B35] text-sm">
                        {r.fromCity} → {r.toCity}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.distanceKm} km • Approx {r.typicalDurationHours} hours
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#101B35] text-sm">₹{r.basePrice}</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">Active Route</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FINANCIAL LEDGER & PAYOUTS */}
        {activeTab === "settlements" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#101B35]">Immutable Financial Ledger & Settlements</h2>
                  <p className="text-xs text-slate-500 mt-1">Audit trail of ticket captures, platform commission earnings, and Razorpay Route transfers.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Default Operator Split</div>
                  <div className="text-lg font-bold text-emerald-600">90% Payout / 10% Fee</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Event Type</th>
                    <th className="px-6 py-4">Notes</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No financial transactions yet. Make a demo booking in the mobile app to record entries!
                      </td>
                    </tr>
                  ) : (
                    ledger.map((entry) => (
                      <tr key={entry._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#101B35]">{entry.transactionReference}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            entry.eventType.includes("CAPTURED")
                              ? "bg-emerald-100 text-emerald-800"
                              : entry.eventType.includes("COMMISSION")
                              ? "bg-orange-100 text-[#FF7547]"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {entry.eventType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{entry.notes}</td>
                        <td className="px-6 py-4 font-bold text-[#101B35]">
                          ₹{entry.creditAmount > 0 ? entry.creditAmount : entry.debitAmount}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(entry.timestamp).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PROMOTIONS & COUPONS */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-[#101B35]">Promotional Coupons Engine</h2>
              <p className="text-xs text-slate-500 mt-1">Live active coupons verified against passenger bookings.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {coupons.map((c) => (
                <div key={c._id} className="bg-white p-6 rounded-3xl border border-dashed border-[#FF7547]/50 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-base font-black px-3 py-1 rounded-xl bg-[#FF7547]/10 text-[#FF7547] border border-[#FF7547]/20">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="font-bold text-[#101B35] text-base mb-1">{c.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">{c.description}</p>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Min Amount: <span className="font-semibold text-slate-700">₹{c.minBookingAmount}</span></div>
                    <div>Valid Until: <span className="font-semibold text-slate-700">{c.validUntil}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
