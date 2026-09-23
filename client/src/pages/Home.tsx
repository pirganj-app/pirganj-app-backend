import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  BellRing,
  CircleCheck,
  Database,
  HeartPulse,
  LayoutDashboard,
  Loader2,
  Megaphone,
  ServerCog,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ApiState = "loading" | "ready" | "offline";
type HealthResponse = { status?: string; service?: string; timestamp?: string };
type Category = { id: number; name: string; icon?: string | null };
type Version = { versionName: string; versionCode: number; forceUpdate: boolean } | null;
type Metrics = { users: number; posts: number; services: number; donors: number; emergencyRequests: number; openReports: number };

const API_BASE = "/api";

function LoadingCard() {
  return <div className="h-28 animate-pulse rounded-2xl bg-muted/60" aria-label="লোড হচ্ছে" />;
}

function MetricCard({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: typeof Users; accent: string }) {
  return (
    <Card className="border-0 bg-card/90 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [apiState, setApiState] = useState<ApiState>("loading");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [version, setVersion] = useState<Version>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      setApiState("loading");
      try {
        const [healthRes, categoryRes, versionRes] = await Promise.all([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/app-version`),
        ]);
        if (!healthRes.ok) throw new Error("health");
        const [healthData, categoryData, versionData] = await Promise.all([healthRes.json(), categoryRes.json(), versionRes.json()]);
        if (!active) return;
        setHealth(healthData);
        setCategories(categoryData.data ?? []);
        setVersion(versionData.data ?? null);
        setApiState("ready");
      } catch {
        if (active) setApiState("offline");
      }
    }
    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let active = true;
    fetch(`${API_BASE}/admin/dashboard`)
      .then(response => (response.ok ? response.json() : null))
      .then(payload => {
        if (active && payload?.data) setMetrics(payload.data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const apiLabel = useMemo(() => {
    if (apiState === "loading") return "সংযোগ হচ্ছে";
    if (apiState === "offline") return "সংযোগ পাওয়া যাচ্ছে না";
    return "সক্রিয় ও প্রস্তুত";
  }, [apiState]);

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-emerald-900/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/15">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Pirganj Backend</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">পীরগঞ্জ তথ্যসেবা কেন্দ্র</h1>
              <p className="mt-1 text-sm text-muted-foreground">মোবাইল অ্যাপ, প্রশাসন ও API ব্যবস্থাপনার ভিত্তি</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 rounded-full border-emerald-700/20 bg-white px-3 py-1.5 text-emerald-800">
              <span className={`h-2 w-2 rounded-full ${apiState === "ready" ? "bg-emerald-500" : apiState === "loading" ? "animate-pulse bg-amber-400" : "bg-red-500"}`} />
              {apiLabel}
            </Badge>
            {!authLoading && !user ? <Button onClick={() => startLogin()} className="rounded-full bg-emerald-700 hover:bg-emerald-800">প্রশাসক লগইন</Button> : null}
          </div>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden border-0 bg-emerald-950 text-white shadow-xl shadow-emerald-950/10">
            <CardContent className="relative p-7 sm:p-9">
              <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="relative max-w-2xl">
                <Badge className="mb-4 border border-emerald-200/20 bg-emerald-500/15 text-emerald-100">BACKEND FOUNDATION</Badge>
                <h2 className="text-3xl font-bold leading-tight sm:text-4xl">একটি সহজ, দ্রুত ও নিরাপদ স্থানীয় সেবার প্ল্যাটফর্ম</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-100/80">পাবলিক তথ্য, সেবা ডিরেক্টরি, কমিউনিটি পোস্ট, রক্তদাতা, জরুরি অনুরোধ এবং version check API এখন একই backend contract-এর মধ্যে সাজানো।</p>
                <div className="mt-7 flex flex-wrap gap-3 text-sm text-emerald-50/90">
                  {["পাবলিক API", "ডাটাবেস প্রস্তুত", "অ্যাপ সংযোগযোগ্য"].map(label => <span key={label} className="rounded-full bg-white/10 px-3 py-1.5">{label}</span>)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><ServerCog className="h-5 w-5 text-emerald-700" /> API অবস্থা</CardTitle>
            </CardHeader>
            <CardContent>
              {apiState === "loading" ? <div className="space-y-3"><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /><div className="h-10 animate-pulse rounded-xl bg-muted" /></div> : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-900"><CircleCheck className="h-5 w-5" /><span className="text-sm font-medium">{health?.service ?? "Pirganj backend"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">স্ট্যাটাস</span><span className="font-semibold">{health?.status === "ok" ? "স্বাভাবিক" : "পরীক্ষাধীন"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">শেষ পরীক্ষা</span><span className="font-semibold">এই মুহূর্তে</span></div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-semibold text-emerald-700">সিস্টেম ওভারভিউ</p><h2 className="mt-1 text-2xl font-bold tracking-tight">আজকের প্রস্তুতি</h2></div><p className="text-sm text-muted-foreground">ডাটা না আসা পর্যন্ত প্রতিটি কার্ডে হালকা loading animation থাকে</p></div>
          {user?.role === "admin" && metrics ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <MetricCard label="ব্যবহারকারী" value={metrics.users} icon={Users} accent="bg-blue-50 text-blue-700" />
              <MetricCard label="পোস্ট" value={metrics.posts} icon={Megaphone} accent="bg-violet-50 text-violet-700" />
              <MetricCard label="সেবা" value={metrics.services} icon={Store} accent="bg-amber-50 text-amber-700" />
              <MetricCard label="রক্তদাতা" value={metrics.donors} icon={HeartPulse} accent="bg-rose-50 text-rose-700" />
              <MetricCard label="জরুরি অনুরোধ" value={metrics.emergencyRequests} icon={AlertTriangle} accent="bg-orange-50 text-orange-700" />
              <MetricCard label="রিপোর্ট" value={metrics.openReports} icon={ShieldCheck} accent="bg-emerald-50 text-emerald-700" />
            </div>
          ) : apiState === "loading" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><LoadingCard /><LoadingCard /><LoadingCard /><LoadingCard /></div> : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="API মডিউল" value="৬" icon={Activity} accent="bg-emerald-50 text-emerald-700" />
              <MetricCard label="ডাটা টেবিল" value="১৪" icon={Database} accent="bg-blue-50 text-blue-700" />
              <MetricCard label="সেবা শ্রেণি" value={categories.length || "প্রস্তুত"} icon={Store} accent="bg-amber-50 text-amber-700" />
              <MetricCard label="অ্যাপ ভার্সন" value={version?.versionName ?? "কনফিগার হয়নি"} icon={BellRing} accent="bg-violet-50 text-violet-700" />
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["সেবা ডিরেক্টরি", "হাসপাতাল, ডাক্তার, স্কুল, ব্যবসা ও স্থানীয় সেবা দেখুন", Store],
            ["কমিউনিটি ও জরুরি", "পোস্ট, হারানো-পাওয়া, রক্ত ও জরুরি অনুরোধ", Megaphone],
            ["নিরাপত্তা ও নিয়ন্ত্রণ", "Admin authorization, report moderation ও version control", ShieldCheck],
          ].map(([title, description, Icon]) => {
            const FeatureIcon = Icon as typeof Store;
            return <Card key={title as string} className="border-0 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"><CardContent className="p-5"><FeatureIcon className="h-5 w-5 text-emerald-700" /><h3 className="mt-4 font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description as string}</p></CardContent></Card>;
          })}
        </section>

        {apiState === "loading" ? <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> তথ্য যাচাই করা হচ্ছে…</div> : null}
        {apiState === "offline" ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">ইন্টারনেট বা backend সংযোগ পাওয়া যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।</div> : null}
      </div>
    </main>
  );
}
