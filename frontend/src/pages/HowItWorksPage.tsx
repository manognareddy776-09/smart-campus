import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  FileQuestion,
  PlusCircle,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
            Student Guide
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4 mb-4">
            How Smart Campus Lost &amp; Found Works
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Reuniting college students with their lost belongings through transparent similarity matching and private ownership verification.
          </p>
        </div>

        {/* 3 Step Deep Dive */}
        <div className="space-y-10 mb-16">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 font-extrabold text-2xl flex items-center justify-center shrink-0">
              01
            </div>
            <div className="space-y-3 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                1. Report a Lost or Found Belonging
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you misplaced a valuable laptop charger or discovered someone’s student card in the lecture hall, submit a report in under two minutes.
              </p>
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                <strong>Crucial Security Rule for Finders:</strong> Do not publicly publish full identification numbers, serial numbers, passwords, or hidden markings. Save those characteristics for the ownership claim stage!
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-extrabold text-2xl flex items-center justify-center shrink-0">
              02
            </div>
            <div className="space-y-3 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                2. Automated Smart Similarity Matching
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our lightweight, transparent matching engine cross-references active lost reports against found listings in real time without paid external AI APIs:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Category matching (30% weight)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>TF-IDF text similarity (35% weight)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Location proximity (15% weight)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Date &amp; campus proximity (20% weight)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-extrabold text-2xl flex items-center justify-center shrink-0">
              03
            </div>
            <div className="space-y-3 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                3. Private Claim &amp; Safe Campus Return
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                When you spot an item that belongs to you, submit a confidential Ownership Claim. Only the finder can view your proof explanation. Once verified:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc list-inside">
                <li>The finder accepts your claim in their dashboard.</li>
                <li>Both parties coordinate the return safely via private in-app messages.</li>
                <li>Handovers take place at the Central Campus Safety Desk or Security Reception.</li>
                <li>The item is marked as "Returned to Owner".</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-5 divide-y divide-slate-100 text-sm">
            <div className="pt-4 first:pt-0">
              <h4 className="font-bold text-slate-800 mb-1">What if I found a Student ID Card?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report the card with the student's name, but do not show the full roll number or barcode. Hand the physical card to the nearest security or campus reception desk.
              </p>
            </div>
            <div className="pt-4">
              <h4 className="font-bold text-slate-800 mb-1">Can anyone see my phone number or email?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No! The system is engineered to protect student privacy. Communication takes place through secure authenticated in-app messages and private claims.
              </p>
            </div>
            <div className="pt-4">
              <h4 className="font-bold text-slate-800 mb-1">How does smart matching work?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you submit a report, our background scoring engine calculates a 0-100% similarity score with all opposite listings. If similarity exceeds 60%, an instant in-app notification is triggered!
              </p>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="text-center p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/25">
          <h3 className="text-2xl font-extrabold mb-2">Ready to find or report an item?</h3>
          <p className="text-blue-100 text-xs sm:text-sm mb-6 max-w-md mx-auto">
            Join your fellow students and help keep your university community connected.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/report/lost"
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors"
            >
              Report Lost Belonging
            </Link>
            <Link
              to="/browse"
              className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs border border-blue-500 transition-colors"
            >
              Browse Active Listings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
