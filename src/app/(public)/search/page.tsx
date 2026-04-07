"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import type { UserProfileDoc } from "@/types";

const SPECIALTIES = [
  "Cardiologist",
  "Dermatologist",
  "Dentist",
  "Pediatrician",
  "Orthopedic",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("");
  const [results, setResults] = useState<UserProfileDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (specialty?: string, q?: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (specialty) params.set("specialty", specialty);
      if (q) params.set("q", q);
      const res = await fetch(`/api/doctors?${params.toString()}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Load all doctors on mount
  useEffect(() => {
    doSearch();
  }, []);

  const handleSearch = () => {
    doSearch(activeSpecialty, query);
  };

  const handleSpecialtyClick = (spec: string) => {
    const next = activeSpecialty === spec ? "" : spec;
    setActiveSpecialty(next);
    doSearch(next, query);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Search
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Find a doctor or clinic.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Search by specialty, doctor name, city, or clinic.
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="e.g. Cardiologist, Dr. Khan, Lahore..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SPECIALTIES.map((label) => (
                <Button
                  key={label}
                  variant={activeSpecialty === label ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => handleSpecialtyClick(label)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">Booking tips</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Pick a specialty first, then choose a doctor.</li>
              <li>Check ratings and consultation fees upfront.</li>
              <li>Book from available time slots instantly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Results{results.length > 0 ? ` (${results.length})` : ""}
          </h2>
        </div>

        {loading ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 && searched ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            No doctors found. Try a different search.
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {results.map((doc) => (
              <DoctorCard key={doc.uid} doc={doc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
