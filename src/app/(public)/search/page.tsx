import Link from "next/link";
import { Building2, CalendarCheck2, Search, Stethoscope } from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const demoResults = [
  {
    type: "Clinic",
    name: "Evergreen Family Clinic",
    slug: "evergreen-family-clinic",
    tags: ["Primary care", "Walk-ins"],
  },
  {
    type: "Clinic",
    name: "Harbor Dental Care",
    slug: "harbor-dental-care",
    tags: ["Dentistry", "Oral surgery"],
  },
  {
    type: "Clinic",
    name: "Summit Skin & Wellness",
    slug: "summit-skin-wellness",
    tags: ["Dermatology", "Cosmetic"],
  },
] as const;

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Search
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Find a clinic or specialist.
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-[15px]">
            Start with a specialty, clinic name, or provider.
          </p>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Search
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Type a specialty or clinic name.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Input placeholder="e.g. cardiology, dental, clinic name…" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Primary care", "Dentistry", "Dermatology", "Pediatrics"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {label}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-slate-900">
                Booking tips
              </p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li>Pick a specialty first, then choose a clinic.</li>
                <li>Review available slots and confirm your details.</li>
                <li>Keep follow-ups organized in your dashboard.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Results (demo)
            </h2>
            <p className="text-xs text-slate-500">
              UI preview only — connect to real data later.
            </p>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {demoResults.map((r) => (
              <Card
                key={r.slug}
                className="rounded-2xl border-slate-200/70 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {r.type}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {r.name}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                      {r.type === "Clinic" ? (
                        <Building2 className="h-5 w-5 text-slate-700" />
                      ) : (
                        <Stethoscope className="h-5 w-5 text-slate-700" />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <Link href={`/c/${r.slug}`}>
                      <Button variant="outline" className="h-10 w-full rounded-xl">
                        View details
                      </Button>
                    </Link>
                    <Link href={`/book/${r.slug}`}>
                      <Button className="h-10 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                        <CalendarCheck2 className="mr-2 h-4 w-4" />
                        Book
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
