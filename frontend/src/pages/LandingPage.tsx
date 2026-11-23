import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Clock, HeartHandshake, Leaf, ShieldCheck, Sprout, Truck, Utensils } from 'lucide-react';
import { donationsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ total: number; completed: number; urgent: number; totalQty: number } | null>(null);

  useEffect(() => {
    donationsApi
      .getAll()
      .then((list) => {
        const completed = list.filter((d) => d.status === 'Completed');
        const urgent = list.filter((d) => d.urgencyLevel === 'Critical' || d.urgencyLevel === 'High');
        const totalQty = completed.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
        setStats({ total: list.length, completed: completed.length, urgent: urgent.length, totalQty });
      })
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">RescueFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50/80 via-white to-white py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Leaf className="w-3.5 h-3.5" />
            AI-Assisted Food Waste Prevention &amp; Redistribution
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Rescue Food. Reduce Waste. <span className="text-emerald-600">Feed Communities.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            RescueFlow AI connects restaurants, grocery stores, and supermarkets with verified NGOs and volunteers—prioritizing every surplus meal by real-time urgency before it spoils.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition"
            >
              <span>{user ? 'Open Platform' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Live Backend Stats */}
      {stats && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 mb-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.total}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Total Donations Logged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.completed}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Completed Rescues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.urgent}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">High / Critical Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.totalQty}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Units Food Rescued</div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How RescueFlow AI Works</h2>
          <p className="text-sm text-slate-600 mt-2">Explainable rule-based urgency scoring paired with human-approved dispatch.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">1. Register Surplus Food</h3>
            <p className="text-sm text-slate-600">Donors log food category, quantity, storage condition, and pickup deadline in seconds.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">2. AI Urgency Prioritization</h3>
            <p className="text-sm text-slate-600">Our 100-point rule engine ranks donations by remaining time, perishability, and quantity.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">3. NGO &amp; Volunteer Delivery</h3>
            <p className="text-sm text-slate-600">Verified NGOs accept donations and dispatch volunteers with live pickup-to-delivery tracking.</p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-slate-50 border-t border-slate-100 py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900">For Food Donors</h3>
            <p className="text-sm text-slate-600">Restaurants, bakeries, and supermarkets turn potential waste into tracked community impact.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900">For NGOs</h3>
            <p className="text-sm text-slate-600">View urgency-ranked surplus food, accept safe batches, and coordinate volunteer pickups.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900">For Volunteers</h3>
            <p className="text-sm text-slate-600">Receive clear pickup assignments and confirm collection and delivery in one tap.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
