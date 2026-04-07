"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@/types";

interface PatientSummary {
  patientId: string;
  patientName: string;
  visitCount: number;
  lastVisit: string;
}

export default function DoctorPatients() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok) {
          const appointments: Appointment[] = await res.json();
          // Group by patient
          const map = new Map<string, PatientSummary>();
          for (const apt of appointments) {
            const existing = map.get(apt.patientId);
            if (existing) {
              existing.visitCount++;
              if (apt.date > existing.lastVisit) existing.lastVisit = apt.date;
            } else {
              map.set(apt.patientId, {
                patientId: apt.patientId,
                patientName: apt.patientName,
                visitCount: 1,
                lastVisit: apt.date,
              });
            }
          }
          setPatients(Array.from(map.values()));
        }
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search
    ? patients.filter((p) =>
        p.patientName.toLowerCase().includes(search.toLowerCase())
      )
    : patients;

  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-foreground">My Patients</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and view your patient list.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {patients.length === 0
                ? "No patients yet."
                : "No patients match your search."}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((p) => (
                <div
                  key={p.patientId}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {p.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.visitCount} visit{p.visitCount !== 1 && "s"} &middot;
                      Last: {p.lastVisit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
