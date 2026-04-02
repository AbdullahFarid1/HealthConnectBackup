import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  MapPin,
  Search,
  Shield,
  Star,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/5" />
          <div className="pointer-events-none absolute -top-20 right-0 h-60 w-[400px] rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/5" />

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  PMDC-Verified Doctors Only
                </div>

                <h1 className="animate-fade-in-up-delay-1 mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Find Trusted Doctors
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-teal-400">
                    Near You.
                  </span>
                </h1>
                <p className="animate-fade-in-up-delay-2 mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Pakistan&apos;s trusted healthcare platform. Search verified
                  doctors by specialty, location &amp; ratings — book
                  appointments instantly from available slots.
                </p>

                <div className="animate-fade-in-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/search">
                    <Button className="h-12 w-full rounded-full bg-blue-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/30 sm:w-auto">
                      <Search className="mr-2 h-4 w-4" />
                      Find a Doctor
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-full px-7 text-sm font-semibold sm:w-auto"
                    >
                      Register as Doctor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Trust strip */}
                <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    500+ Verified Doctors
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    Lahore, Islamabad &amp; more
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    Patient-Rated
                  </span>
                </div>
              </div>

              {/* Hero card — platform preview */}
              <Card className="animate-fade-in-up-delay-2 relative overflow-hidden border-border/40 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-teal-50/30 dark:from-blue-500/5 dark:to-teal-500/5" />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        HealthConnect
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        Your health, your choice
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Search, compare &amp; book — all in one place.
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <MiniStat label="Specialties" value="50+ listed" />
                    <MiniStat label="Booking" value="Instant slots" />
                    <MiniStat label="Reviews" value="Verified patients" />
                    <MiniStat label="Fees" value="Transparent PKR" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border/60 bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Book in 3 simple steps
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
                From searching to sitting in the doctor&apos;s office — fast and hassle-free.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <StepCard
                step="01"
                icon={<Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                title="Search &amp; Filter"
                desc="Find doctors by specialty, city, rating, or consultation fee. Compare profiles instantly."
              />
              <StepCard
                step="02"
                icon={<CalendarCheck2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
                title="Pick a Slot"
                desc="View real-time availability and book a slot that fits your schedule. No phone calls needed."
              />
              <StepCard
                step="03"
                icon={<Star className="h-5 w-5 text-amber-500 dark:text-amber-400" />}
                title="Visit &amp; Review"
                desc="Attend your appointment and leave a verified review to help other patients decide."
              />
            </div>
          </div>
        </section>

        {/* For Doctors + For Patients */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Patients */}
              <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-transparent dark:from-blue-500/5" />
                <CardContent className="relative p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    For Patients
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Quick registration, smart search filters, transparent fees,
                    and a review system you can trust. Find the right doctor in
                    minutes.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {[
                      "Search by city, specialty & ratings",
                      "See consultation fees upfront (PKR)",
                      "Book from real-time available slots",
                      "Leave verified reviews after visits",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link href="/register">
                      <Button className="rounded-full bg-blue-600 px-6 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">
                        Sign Up as Patient
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Doctors */}
              <Card className="relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/40 to-transparent dark:from-teal-500/5" />
                <CardContent className="relative p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    For Doctors
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Get discovered by thousands of patients. Build your online
                    presence with a verified profile, clinic listing, and
                    real patient reviews.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {[
                      "PMDC-verified badge on your profile",
                      "List multiple clinics & locations",
                      "Set your own availability & fees",
                      "Grow through patient ratings",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link href="/register">
                      <Button
                        variant="outline"
                        className="rounded-full px-6"
                      >
                        Register as Doctor
                        <Shield className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-teal-500 px-6 py-12 text-white shadow-2xl shadow-blue-500/20 sm:px-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-lg">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Healthcare in Pakistan, reimagined.
                  </h2>
                  <p className="mt-2 text-sm text-white/80 sm:text-base">
                    Whether you&apos;re a patient searching for the right
                    specialist or a doctor looking to grow your practice —
                    HealthConnect is built for you.
                  </p>
                </div>
                <Link href="/register" className="shrink-0">
                  <Button className="h-12 rounded-full bg-white px-8 text-sm font-semibold text-blue-700 shadow-lg hover:bg-white/90">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  desc,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-6">
        <span className="absolute right-4 top-3 text-4xl font-black text-muted/80 dark:text-muted/40">
          {step}
        </span>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {desc}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 px-3.5 py-3 transition-all duration-300 hover:border-primary/30 hover:shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
