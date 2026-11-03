"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { 
  Building2, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  AlertCircle 
} from "lucide-react";

export default function OperatorRegistrationPage() {
  const registerOperator = useMutation((anyApi as any).operators.registerOperator);

  const [form, setForm] = useState({
    companyName: "",
    tradeName: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    officeAddress: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    gstin: "",
    pan: "",
    businessType: "PRIVATE_LIMITED" as const,
    description: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "HDFC Bank",
    branchName: "",
  });

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ operatorId: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await registerOperator({
        ...form,
        businessType: form.businessType as any,
      });
      setSuccessData(res);
    } catch (err: any) {
      setError(err.message || "Failed to submit registration. Please check fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#101B35] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure SSL Onboarding
          </div>
        </div>

        {successData ? (
          <div className="bg-white rounded-3xl p-10 border border-emerald-100 shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-[#101B35] mb-3">Application Submitted!</h2>
            <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
              Your company <span className="font-bold text-[#101B35]">{form.companyName}</span> has been registered and is now in <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">PENDING</span> status. Our compliance team will review your GSTIN and bank details.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs space-y-2 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Email:</span>
                <span className="font-semibold text-slate-800">{form.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Account:</span>
                <span className="font-semibold text-slate-800">•••• {form.accountNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marketplace Route:</span>
                <span className="font-semibold text-emerald-600">Razorpay Route (90% Payout)</span>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Link
                href="/admin"
                className="bg-[#101B35] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#19243B] transition-colors"
              >
                View in Super Admin
              </Link>
              <Link
                href="/"
                className="border border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Return to Gateway
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-xl">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF7547] to-[#FFA07A] flex items-center justify-center text-white shadow-lg shadow-[#FF7547]/20">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#101B35]">
                  Bus Operator Partner Registration
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Join 20+ verified bus operators on Tripzo. Receive bookings and daily automated payouts.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Business Details */}
              <div>
                <h3 className="text-base font-bold text-[#101B35] mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#FF7547]" />
                  Company & Legal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company Registered Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Express Bus Lines Pvt Ltd"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Brand / Trade Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Express"
                      value={form.tradeName}
                      onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Business Type *</label>
                    <select
                      value={form.businessType}
                      onChange={(e) => setForm({ ...form, businessType: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547] bg-white"
                    >
                      <option value="PRIVATE_LIMITED">Private Limited Company</option>
                      <option value="LLP">Limited Liability Partnership (LLP)</option>
                      <option value="PARTNERSHIP">Partnership Firm</option>
                      <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                      <option value="PUBLIC_LIMITED">Public Limited</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 29AAACP1234Z1Z5"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Person */}
              <div>
                <h3 className="text-base font-bold text-[#101B35] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF7547]" />
                  Contact Person & Credentials
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Authorized Director / Manager"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="ops@yourbuscompany.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Portal Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Set access password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone (OTP verification) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Office Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Street, Terminal Bay"
                      value={form.officeAddress}
                      onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Protected Settlement Bank Account */}
              <div>
                <h3 className="text-base font-bold text-[#101B35] mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Settlement Bank Account (For Razorpay Route Payouts)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Name as per Bank Record"
                      value={form.accountHolderName}
                      onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="Current / Settlement Account Number"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0001234"
                      value={form.ifscCode}
                      onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF7547]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                By clicking Submit, you agree to the Tripzo Bus Marketplace Merchant Terms. Your company will receive daily automated settlements (90% of ticket fares after deducting 10% platform commission) through Razorpay Route linked account verification.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF7547] hover:bg-[#E55C2F] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#FF7547]/25 transition-all text-base disabled:opacity-50"
              >
                {loading ? "Registering on Convex Cloud..." : "Submit Operator Registration"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
