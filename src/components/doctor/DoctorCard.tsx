"use client";

import Link from "next/link";
import { CalendarCheck2, Eye, MapPin, Star, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserProfileDoc } from "@/types";
import { RatingStars } from "@/components/doctor/RatingStars";

export function DoctorCard({ doc }: { doc: UserProfileDoc }) {
  const ratingAverage = doc.ratingAverage ?? 0;
  const ratingCount = doc.ratingCount ?? 0;
  return (
    <Card className="group hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                Doctor
              </Badge>
              <Badge variant="info" className="text-[10px]">
                New
              </Badge>
            </div>
            <p className="text-sm font-semibold text-foreground">{doc.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {doc.specialty ?? "General Practitioner"}
            </p>
          </div>
          {doc.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.photoUrl}
              alt={doc.name}
              className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/10">
              <Stethoscope className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {doc.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {doc.city}
            </span>
          )}
          {ratingCount > 0 ? (
            <span className="flex items-center gap-1">
              <RatingStars value={ratingAverage} size={12} />
              <span className="font-medium text-foreground">
                {ratingAverage.toFixed(1)}
              </span>
              <span>({ratingCount})</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" /> New
            </span>
          )}
          {doc.consultationFee ? (
            <span className="font-semibold text-foreground">
              PKR {doc.consultationFee.toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground">Fee not set</span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/c/${doc.uid}`}>
            <Button
              variant="outline"
              className="h-10 w-full rounded-xl"
            >
              <Eye className="mr-2 h-4 w-4" /> View Details
            </Button>
          </Link>
          <Link href={`/book/${doc.uid}`}>
            <Button className="h-10 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <CalendarCheck2 className="mr-2 h-4 w-4" /> Book
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
