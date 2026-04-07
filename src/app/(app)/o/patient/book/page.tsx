"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import type { UserProfileDoc } from "@/types";

const SPECIALTIES = ["Cardiologist", "Dermatologist", "Dentist", "Orthopedic", "ENT"];

export default function PatientBook() {
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

  const handleSearch = () => doSearch(activeSpecialty, query);

  const handleSpecialtyClick = (spec: string) => {
    const next = activeSpecialty === spec ? "" : spec;
    setActiveSpecialty(next);
    doSearch(next, query);
  };

  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Book an Appointment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for a doctor by name, specialty, or city.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search doctors, specialties, clinics..."
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SPECIALTIES.map((tag) => (
              <Button
                key={tag}
                variant={activeSpecialty === tag ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs"
                onClick={() => handleSpecialtyClick(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : results.length === 0 && searched ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No doctors found. Try a different search.
        </p>
      ) : results.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {results.map((doc) => (
            <DoctorCard key={doc.uid} doc={doc} />
          ))}
        </div>
      ) : null}
    </>
  );
}
