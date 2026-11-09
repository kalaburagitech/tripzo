"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { 
  Bus, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Users, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Smartphone
} from "lucide-react";

export default function HomePage() {
  const metrics = useQuery((anyApi as any).reports.getSuperAdminMetrics, {}) as any;

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Top Navigation */}
      <header className="bg-[#101B35] text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7547] to-[#FFA07A] flex items-center justify-center font-bold text-white shadow-lg shadow-[#FF7547]/20">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">Tripzo</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-[#FF7547]/20 text-[#FF7547] font-semibold border border-[#FF7547]/30">
                Marketplace v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/operator/register"
              className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              Register Bus Company
            </Link>
            <Link
              href="/operator"
              className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              Operator Portal
            </Link>
            <Link
              href="/admin"
              className="bg-[#FF7547] hover:bg-[#E55C2F] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#FF7547]/25 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#101B35] via-[#152345] to-[#F5F7FB] pt-16 pb-24 text-white px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7547]" />
            Multi-Operator Indian Intercity Bus Booking Ecosystem
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Next-Gen Bus Travel Marketplace <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7547] to-[#FFA07A]">
              Empowered by Convex & Razorpay
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            RedBus-scale multi-operator platform connecting private fleet operators, live GPS tracking, concurrency-safe seat locking, automated commissions, and linked Razorpay marketplace settlements.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <Building2 className="w-4 h-4 text-[#FF7547]" /> Registered Operators
              </div>
              <div className="text-3xl font-black text-white">
                {metrics ? metrics.totalOperators : "20"}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">100% Verified Fleet</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <Bus className="w-4 h-4 text-blue-400" /> Active Buses
              </div>
              <div className="text-3xl font-black text-white">
                {metrics ? metrics.totalBuses : "100"}
              </div>
              <span className="text-[11px] text-slate-300 font-medium">Sleeper & Seater AC</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <MapPin className="w-4 h-4 text-amber-400" /> Master Routes
              </div>
              <div className="text-3xl font-black text-white">
                {metrics ? metrics.totalTrips : "50"}
              </div>
              <span className="text-[11px] text-slate-300 font-medium">South & Central India</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Platform Commission
              </div>
              <div className="text-3xl font-black text-white">
                10%
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">Automated Route Split</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Portals Grid */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Super Admin */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#101B35] flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-[#FF7547]" />
              </div>
              <h3 className="text-2xl font-bold text-[#101B35] mb-3">Super Admin Dashboard</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Complete platform command center. Review operator KYC, configure commissions, monitor Gross Booking Value, audit immutable financial ledgers, and execute Razorpay Route transfers.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium mb-8">
                <li className="flex items-center gap-2">✓ Operator Approval Workflow</li>
                <li className="flex items-center gap-2">✓ Real-time Financial Ledger & Splits</li>
                <li className="flex items-center gap-2">✓ Fleet & 50 Master Routes Control</li>
                <li className="flex items-center gap-2">✓ Coupon Engine & Support Tickets</li>
              </ul>
            </div>
            <Link
              href="/admin"
              className="w-full bg-[#101B35] hover:bg-[#19243B] text-white font-bold py-3.5 px-6 rounded-2xl text-center text-sm transition-colors flex items-center justify-center gap-2"
            >
              Open Super Admin <ArrowRight className="w-4 h-4 text-[#FF7547]" />
            </Link>
          </div>

          {/* Card 2: Operator Portal */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF7547] to-[#FFA07A] flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#FF7547]/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#101B35] mb-3">Operator Management Portal</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Dedicated portal for bus companies (e.g. VRL Travels, Orange Tours). Manage fleet vehicles, schedule daily trips, access live passenger manifests, and track bank payouts.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium mb-8">
                <li className="flex items-center gap-2">✓ Fleet Vehicles & Amenities</li>
                <li className="flex items-center gap-2">✓ Trip Scheduling & Fare Pricing</li>
                <li className="flex items-center gap-2">✓ Conductor Passenger Manifests</li>
                <li className="flex items-center gap-2">✓ Settlement Payout Ledger (Net 90%)</li>
              </ul>
            </div>
            <Link
              href="/operator"
              className="w-full bg-[#FF7547] hover:bg-[#E55C2F] text-white font-bold py-3.5 px-6 rounded-2xl text-center text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#FF7547]/20"
            >
              Open Operator Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Bus Company Registration */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#101B35] mb-3">Bus Company Registration</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Self-service onboarding portal for new private bus travel companies. Submit company details, GSTIN, fleet information, and settlement bank accounts for admin approval.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium mb-8">
                <li className="flex items-center gap-2">✓ Business & GSTIN Registration</li>
                <li className="flex items-center gap-2">✓ Bank Account KYC Submission</li>
                <li className="flex items-center gap-2">✓ Instant Application Tracking</li>
                <li className="flex items-center gap-2">✓ Automatic Razorpay Route Setup</li>
              </ul>
            </div>
            <Link
              href="/operator/register"
              className="w-full border-2 border-[#101B35] text-[#101B35] hover:bg-[#101B35] hover:text-white font-bold py-3.5 px-6 rounded-2xl text-center text-sm transition-colors flex items-center justify-center gap-2"
            >
              Register as Operator <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Mobile App Passenger Experience Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#101B35] to-[#1E2F5B] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FF7547]/20 border border-[#FF7547]/40 flex items-center justify-center text-[#FF7547]">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold">Tripzo Passenger Android Application</h4>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                The mobile app is actively connected to this Convex backend. Search through all 100 buses across 50 Indian routes, lock seats with real-time concurrency protection, and generate QR tickets.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-emerald-400 border border-emerald-400/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live on Convex Cloud
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
