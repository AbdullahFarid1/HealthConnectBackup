"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Calendar,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  UserPlus,
  Users,
  X,
  Upload,
  MapPin,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  UserProfileDoc,
  ClinicDoc,
  AvailabilityDoc,
  SlotDuration,
  ReceptionistPermissions,
} from "@/types";
import { DEFAULT_RECEPTIONIST_PERMISSIONS } from "@/types";
import { formatCnic, isValidCnic, normalizeCnic } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOT_DURATIONS: SlotDuration[] = [15, 30, 45, 60];

// ─── Helper ──────────────────────────────────────────────────
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── Main Component ──────────────────────────────────────────
export default function DoctorProfile() {
  // Profile fields
  const [name, setName] = useState("");
  const [pmdc, setPmdc] = useState("");
  const [cnic, setCnic] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [fee, setFee] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoMessageKind, setPhotoMessageKind] = useState<"info" | "success" | "error">("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Clinics
  const [clinics, setClinics] = useState<ClinicDoc[]>([]);
  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    mapUrl: "",
  });
  const [locationMessage, setLocationMessage] = useState("");
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [clinicLoading, setClinicLoading] = useState(false);

  // Availability
  const [availability, setAvailability] = useState<AvailabilityDoc[]>([]);
  const [avForm, setAvForm] = useState({
    clinicId: "",
    selectedDays: [] as number[],
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30 as SlotDuration,
    repeatWeekly: false,
    specificDate: "",
  });
  const [avLoading, setAvLoading] = useState(false);
  const [avError, setAvError] = useState("");

  // Receptionists
  const [receptionists, setReceptionists] = useState<UserProfileDoc[]>([]);
  const [recMode, setRecMode] = useState<"create" | "link">("create");
  const [recForm, setRecForm] = useState({
    name: "",
    email: "",
    phone: "",
    clinicIds: [] as string[],
    permissions: { ...DEFAULT_RECEPTIONIST_PERMISSIONS } as ReceptionistPermissions,
  });
  const [recLoading, setRecLoading] = useState(false);
  const [recTempPassword, setRecTempPassword] = useState("");
  const [recCreatedEmail, setRecCreatedEmail] = useState("");
  const [recLookup, setRecLookup] = useState<
    | null
    | {
        exists: boolean;
        canLink?: boolean;
        alreadyLinked?: boolean;
        role?: string;
        reason?: string;
        profile?: { uid: string; name: string; email: string; phone: string };
      }
  >(null);

  // ─── Load all data ─────────────────────────────────────────
  const loadClinics = useCallback(async () => {
    try {
      const res = await fetch("/api/clinics");
      if (res.ok) setClinics(await res.json());
    } catch { /* empty */ }
  }, []);

  const loadAvailability = useCallback(async () => {
    // Load availability for all clinics
    const allAv: AvailabilityDoc[] = [];
    for (const c of clinics) {
      try {
        const res = await fetch(`/api/availability?clinicId=${c.id}`);
        if (res.ok) {
          const items = await res.json();
          allAv.push(...items);
        }
      } catch { /* empty */ }
    }
    setAvailability(allAv);
  }, [clinics]);

  const [myDoctorId, setMyDoctorId] = useState<string>("");
  const loadReceptionists = useCallback(async () => {
    try {
      const res = await fetch("/api/receptionists");
      if (res.ok) {
        const data = await res.json();
        setReceptionists(data.receptionists ?? []);
        setMyDoctorId(data.doctorId ?? "");
      }
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setName(data.name ?? "");
          setPmdc(data.pmdcRegistrationNo ?? "");
          setCnic(data.cnic ? formatCnic(data.cnic) : "");
          setSpecialty(data.specialty ?? "");
          setFee(data.consultationFee?.toString() ?? "");
          setCity(data.city ?? "");
          setBio(data.bio ?? "");
          setPhotoUrl(data.photoUrl ?? "");
        }
      } catch { /* empty */ }
      await loadClinics();
      await loadReceptionists();
      setLoading(false);
    })();
  }, [loadClinics, loadReceptionists]);

  // Load availability when clinics change
  useEffect(() => {
    if (clinics.length > 0) loadAvailability();
  }, [clinics, loadAvailability]);

  // Auto-set first clinic in availability form
  useEffect(() => {
    if (clinics.length > 0 && !avForm.clinicId) {
      setAvForm((f) => ({ ...f, clinicId: clinics[0].id }));
    }
  }, [clinics, avForm.clinicId]);

  // ─── Profile Save ──────────────────────────────────────────
  const handleSaveProfile = async () => {
    setMessage("");
    if (!isValidCnic(cnic)) {
      setMessage("CNIC is required and must be 13 digits (format: XXXXX-XXXXXXX-X).");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name,
          specialty,
          consultationFee: fee ? Number(fee) : undefined,
          city,
          bio,
          photoUrl,
          cnic: normalizeCnic(cnic),
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setCnic(formatCnic(cnic));
        setMessage("Profile updated!");
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to save.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Clinic CRUD ───────────────────────────────────────────
  const handleSaveClinic = async () => {
    if (!clinicForm.name || !clinicForm.address || !clinicForm.city) return;
    setClinicLoading(true);
    try {
      if (editingClinicId) {
        await fetch("/api/clinics", {
          method: "PUT",
          body: JSON.stringify({ id: editingClinicId, ...clinicForm }),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await fetch("/api/clinics", {
          method: "POST",
          body: JSON.stringify(clinicForm),
          headers: { "Content-Type": "application/json" },
        });
      }
      setClinicForm({ name: "", address: "", city: "", phone: "", mapUrl: "" });
      setEditingClinicId(null);
      setLocationMessage("");
      await loadClinics();
    } catch { /* empty */ }
    setClinicLoading(false);
  };

  const handleEditClinic = (c: ClinicDoc) => {
    setEditingClinicId(c.id);
    setClinicForm({
      name: c.name,
      address: c.address,
      city: c.city,
      phone: c.phone,
      mapUrl: c.mapUrl ?? "",
    });
  };

  // ─── Profile picture (simulated upload) ────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setPhotoMessageKind("error");
      setPhotoMessage("Invalid file type. Please choose a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    setPhotoMessageKind("info");
    setPhotoMessage("Uploading image… (simulated — Firebase Storage is not yet wired up)");

    // Simulate an upload by reading as a data URL so we can preview locally.
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setPhotoUrl(dataUrl);
      setPhotoMessageKind("success");
      setPhotoMessage("Profile picture updated. (Simulated upload — click Save Profile to persist the URL.)");
    };
    reader.onerror = () => {
      setPhotoMessageKind("error");
      setPhotoMessage("Unable to store image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    setPhotoMessageKind("info");
    setPhotoMessage("Profile picture removed.");
  };

  // ─── Clinic location picker (simulated Google Maps) ───────
  const handleAttachLocation = () => {
    setLocationMessage(
      "Opening Google Maps… (simulated). Picking a location here will replace any URL pasted above."
    );
    // Simulate a chosen location after a short delay so the user can read the message.
    setTimeout(() => {
      const fakeLat = (24 + Math.random() * 9).toFixed(6);
      const fakeLng = (67 + Math.random() * 8).toFixed(6);
      const url = `https://www.google.com/maps/search/?api=1&query=${fakeLat},${fakeLng}`;
      // Overwrite any previously pasted URL — we only store one location.
      setClinicForm((f) => ({ ...f, mapUrl: url }));
      setLocationMessage(`Location captured (simulated). Stored map link: ${url}`);
    }, 900);
  };

  const handleDeleteClinic = async (id: string) => {
    if (clinics.length <= 1) return;
    setClinicLoading(true);
    try {
      await fetch("/api/clinics", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      await loadClinics();
    } catch { /* empty */ }
    setClinicLoading(false);
  };

  // ─── Availability CRUD ─────────────────────────────────────
  const toggleDay = (day: number) => {
    setAvForm((f) => ({
      ...f,
      selectedDays: f.selectedDays.includes(day)
        ? f.selectedDays.filter((d) => d !== day)
        : [...f.selectedDays, day],
    }));
  };

  const toggleAllDays = () => {
    setAvForm((f) => ({
      ...f,
      selectedDays: f.selectedDays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6],
    }));
  };

  const handleSaveAvailability = async () => {
    setAvError("");
    if (!avForm.clinicId) return;
    if (avForm.repeatWeekly && avForm.selectedDays.length === 0) {
      setAvError("Please select at least one day.");
      return;
    }
    if (!avForm.repeatWeekly && !avForm.specificDate) {
      setAvError("Please pick a date for this one-off slot.");
      return;
    }
    if (avForm.endTime <= avForm.startTime) {
      setAvError("End time must be later than start time.");
      return;
    }
    setAvLoading(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        body: JSON.stringify({
          clinicId: avForm.clinicId,
          repeatWeekly: avForm.repeatWeekly,
          ...(avForm.repeatWeekly
            ? { daysOfWeek: avForm.selectedDays }
            : { specificDate: avForm.specificDate }),
          startTime: avForm.startTime,
          endTime: avForm.endTime,
          slotDuration: avForm.slotDuration,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAvError(data.error ?? "Failed to save availability.");
      } else {
        setAvForm((f) => ({ ...f, selectedDays: [], specificDate: "" }));
        await loadAvailability();
      }
    } catch {
      setAvError("Network error.");
    }
    setAvLoading(false);
  };

  const handleDeleteAvailability = async (id: string) => {
    setAvLoading(true);
    try {
      await fetch("/api/availability", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      await loadAvailability();
    } catch { /* empty */ }
    setAvLoading(false);
  };

  // ─── Receptionist CRUD ─────────────────────────────────────
  const [recError, setRecError] = useState("");

  const handleLookupEmail = async () => {
    setRecError("");
    setRecLookup(null);
    const email = recForm.email.trim();
    if (!email) {
      setRecError("Please enter an email to search.");
      return;
    }
    setRecLoading(true);
    try {
      const res = await fetch(`/api/receptionists?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) {
        setRecLookup(data);
        if (!data.exists) {
          setRecError("No existing user with that email. Use the 'Create New' tab instead.");
        } else if (!data.canLink) {
          setRecError(data.reason ?? "This email cannot be linked.");
        } else if (data.alreadyLinked) {
          setRecError("This receptionist is already linked to you.");
        }
      } else {
        setRecError(data.error ?? "Lookup failed.");
      }
    } catch {
      setRecError("Network error. Please try again.");
    }
    setRecLoading(false);
  };

  const handleSubmitReceptionist = async () => {
    setRecError("");
    setRecTempPassword("");
    setRecCreatedEmail("");

    if (!recForm.email.trim()) {
      setRecError("Please enter the receptionist's email.");
      return;
    }
    if (recMode === "create" && !recForm.name.trim()) {
      setRecError("Please enter the receptionist's name.");
      return;
    }
    if (recForm.clinicIds.length === 0) {
      setRecError("Please assign the receptionist to at least one clinic.");
      return;
    }
    if (recMode === "link") {
      if (!recLookup?.canLink || recLookup.alreadyLinked) {
        setRecError("Search for an existing receptionist first.");
        return;
      }
    }

    setRecLoading(true);
    try {
      const res = await fetch("/api/receptionists", {
        method: "POST",
        body: JSON.stringify({
          mode: recMode,
          name: recForm.name,
          email: recForm.email,
          phone: recForm.phone,
          clinicIds: recForm.clinicIds,
          permissions: recForm.permissions,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.tempPassword) {
          setRecTempPassword(data.tempPassword);
          setRecCreatedEmail(data.email ?? recForm.email);
        }
        setRecForm({
          name: "",
          email: "",
          phone: "",
          clinicIds: [],
          permissions: { ...DEFAULT_RECEPTIONIST_PERMISSIONS },
        });
        setRecLookup(null);
        await loadReceptionists();
      } else {
        setRecError(data.error ?? "Failed to add receptionist.");
      }
    } catch {
      setRecError("Network error. Please try again.");
    }
    setRecLoading(false);
  };

  const handleUnlinkReceptionist = async (uid: string) => {
    if (!confirm("Unlink this receptionist? Their account will remain so they can continue working for other doctors.")) return;
    setRecLoading(true);
    try {
      await fetch("/api/receptionists", {
        method: "DELETE",
        body: JSON.stringify({ uid }),
        headers: { "Content-Type": "application/json" },
      });
      await loadReceptionists();
    } catch { /* empty */ }
    setRecLoading(false);
  };

  const handleTogglePermission = async (
    r: UserProfileDoc,
    key: keyof ReceptionistPermissions
  ) => {
    if (!myDoctorId) return;
    const current =
      r.doctorPermissions?.[myDoctorId] ?? { ...DEFAULT_RECEPTIONIST_PERMISSIONS };
    const next: ReceptionistPermissions = { ...current, [key]: !current[key] };

    setReceptionists((prev) =>
      prev.map((x) =>
        x.uid === r.uid
          ? { ...x, doctorPermissions: { ...(x.doctorPermissions ?? {}), [myDoctorId]: next } }
          : x
      )
    );

    try {
      await fetch("/api/receptionists", {
        method: "PUT",
        body: JSON.stringify({ uid: r.uid, permissions: next }),
        headers: { "Content-Type": "application/json" },
      });
    } catch { /* empty */ }
  };

  const toggleClinicAssignment = (clinicId: string) => {
    setRecForm((f) => ({
      ...f,
      clinicIds: f.clinicIds.includes(clinicId)
        ? f.clinicIds.filter((id) => id !== clinicId)
        : [...f.clinicIds, clinicId],
    }));
  };

  // Helper: surface the permissions + invite state for THIS doctor (the
  // session owner). Because the client never receives the doctor uid in a
  // stable way, we pick the first entry — there's only one per profile from
  // the perspective of the /api/receptionists list filtered by this doctor.
  const pickMyState = (r: UserProfileDoc) => {
    const inviteState = myDoctorId ? r.doctorInviteStatuses?.[myDoctorId] : undefined;
    const myPerms: ReceptionistPermissions = myDoctorId
      ? r.doctorPermissions?.[myDoctorId] ?? { ...DEFAULT_RECEPTIONIST_PERMISSIONS }
      : { ...DEFAULT_RECEPTIONIST_PERMISSIONS };
    return { inviteState, myPerms };
  };

  // ─── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Profile Info ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Doctor Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your practice details and PMDC verification.
          </p>
        </div>
        {pmdc && <Badge variant="success">PMDC Verified</Badge>}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {message && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground">
              {message}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Your Name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">PMDC Registration No.</label>
              <Input value={pmdc} disabled placeholder="12345-P" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                CNIC <span className="text-destructive">*</span>
                <span className="ml-1 font-normal text-muted-foreground">
                  (required for PMDC verification)
                </span>
              </label>
              <Input
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="XXXXX-XXXXXXX-X"
                inputMode="numeric"
                maxLength={15}
                aria-invalid={cnic.length > 0 && !isValidCnic(cnic)}
              />
              {cnic.length > 0 && !isValidCnic(cnic) && (
                <p className="text-[11px] text-destructive">
                  CNIC must be 13 digits (format: XXXXX-XXXXXXX-X).
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Primary Specialty</label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Cardiologist" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Consultation Fee (PKR)</label>
              <Input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g. 2000" type="number" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Bio</label>
              <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Profile picture{" "}
                <span className="font-normal text-muted-foreground">(optional — shown on patient search results)</span>
              </label>
              <div className="flex items-center gap-3">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt="Doctor preview"
                    className="h-14 w-14 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">
                    No photo
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    Attach Profile Picture
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </label>
                  {photoUrl && (
                    <Button
                      variant="outline"
                      type="button"
                      className="rounded-xl"
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              {photoMessage && (
                <div
                  className={`mt-2 rounded-xl border px-3 py-2 text-xs ${
                    photoMessageKind === "success"
                      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
                      : photoMessageKind === "error"
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>{photoMessage}</span>
                    <button
                      type="button"
                      onClick={() => setPhotoMessage("")}
                      className="text-xs font-semibold underline"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={handleSaveProfile} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* ── Clinic Management ────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Clinics</h2>
      </div>

      {/* Existing clinics */}
      {clinics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {clinics.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.address}, {c.city}</p>
                    {c.phone && <p className="mt-0.5 text-xs text-muted-foreground">{c.phone}</p>}
                    {c.mapUrl && (
                      <a
                        href={c.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-block text-xs text-blue-600 hover:underline"
                      >
                        View on Google Maps
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClinic(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClinic(c.id)}
                      disabled={clinics.length <= 1}
                      title={clinics.length <= 1 ? "Must have at least 1 clinic" : "Delete clinic"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit clinic form */}
      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">
            {editingClinicId ? "Edit Clinic" : "Add Clinic"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Clinic name" value={clinicForm.name} onChange={(e) => setClinicForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="City" value={clinicForm.city} onChange={(e) => setClinicForm((f) => ({ ...f, city: e.target.value }))} />
            <Input placeholder="Full address" value={clinicForm.address} onChange={(e) => setClinicForm((f) => ({ ...f, address: e.target.value }))} className="sm:col-span-2" />
            <Input placeholder="Phone (optional)" value={clinicForm.phone} onChange={(e) => setClinicForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>

          <div className="mt-3 space-y-2">
            <label className="text-xs font-semibold text-foreground">Clinic location</label>
            <p className="text-[11px] text-muted-foreground">
              Pick <strong>one</strong> of the two options below — both save the
              same Google Maps link for your clinic. Using one option will
              overwrite the other, so we only ever store a single location.
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Option 1 — paste a Google Maps URL (e.g. https://maps.app.goo.gl/...)"
                value={clinicForm.mapUrl}
                onChange={(e) => {
                  const value = e.target.value;
                  setClinicForm((f) => ({ ...f, mapUrl: value }));
                  if (value) {
                    setLocationMessage("Map URL pasted. This will replace any location captured via the button.");
                  } else {
                    setLocationMessage("");
                  }
                }}
              />
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                OR
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={handleAttachLocation}
                >
                  <MapPin className="mr-2 h-4 w-4" /> Option 2 — Attach Location
                </Button>
                {clinicForm.mapUrl && (
                  <a
                    href={clinicForm.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Preview on Google Maps
                  </a>
                )}
                {clinicForm.mapUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setClinicForm((f) => ({ ...f, mapUrl: "" }));
                      setLocationMessage("");
                    }}
                    className="text-xs text-muted-foreground underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {locationMessage && (
              <div className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                <div className="flex items-start justify-between gap-2">
                  <span className="break-all">{locationMessage}</span>
                  <button
                    type="button"
                    onClick={() => setLocationMessage("")}
                    className="text-xs font-semibold underline"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={handleSaveClinic} disabled={clinicLoading}>
              {clinicLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-1 h-4 w-4" />
              {editingClinicId ? "Update Clinic" : "Add Clinic"}
            </Button>
            {editingClinicId && (
              <Button variant="outline" className="rounded-xl" onClick={() => { setEditingClinicId(null); setClinicForm({ name: "", address: "", city: "", phone: "", mapUrl: "" }); setLocationMessage(""); }}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Availability ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Availability</h2>
      </div>

      {/* Existing availability blocks */}
      {availability.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {availability.map((a) => {
            const clinic = clinics.find((c) => c.id === a.clinicId);
            return (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {a.repeatWeekly === false && a.specificDate
                        ? a.specificDate
                        : DAY_NAMES[a.dayOfWeek]}
                      {a.repeatWeekly === false ? (
                        <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                          one-off
                        </span>
                      ) : (
                        <span className="ml-1 rounded bg-blue-50 px-1 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          weekly
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(a.startTime)} - {formatTime(a.endTime)} ({a.slotDuration}min)
                    </p>
                    {clinic && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{clinic.name}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteAvailability(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add availability form */}
      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Add Availability</p>
          {avError && (
            <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {avError}
            </div>
          )}
          {/* Recurring toggle — defaults to OFF so slots are NOT auto-applied
              to every upcoming week unless the doctor explicitly opts in. */}
          <label className="mb-3 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs">
            <input
              type="checkbox"
              checked={avForm.repeatWeekly}
              onChange={(e) =>
                setAvForm((f) => ({
                  ...f,
                  repeatWeekly: e.target.checked,
                  selectedDays: [],
                  specificDate: "",
                }))
              }
              className="mt-0.5 h-4 w-4 accent-blue-600"
            />
            <span>
              <span className="font-semibold text-foreground">Repeat weekly</span>
              <span className="ml-1 text-muted-foreground">
                — apply this to every upcoming week. Leave off to add a one-off slot for a specific date.
              </span>
            </span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clinics.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Clinic</label>
                <select
                  value={avForm.clinicId}
                  onChange={(e) => setAvForm((f) => ({ ...f, clinicId: e.target.value }))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {avForm.repeatWeekly ? (
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-foreground">Days</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleAllDays}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      avForm.selectedDays.length === 7
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    Everyday
                  </button>
                  {DAY_NAMES.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        avForm.selectedDays.includes(i)
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Date</label>
                <Input
                  type="date"
                  value={avForm.specificDate}
                  onChange={(e) =>
                    setAvForm((f) => ({ ...f, specificDate: e.target.value }))
                  }
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Start Time</label>
              <Input type="time" value={avForm.startTime} onChange={(e) => setAvForm((f) => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">End Time</label>
              <Input type="time" value={avForm.endTime} onChange={(e) => setAvForm((f) => ({ ...f, endTime: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Slot Duration</label>
              <select
                value={avForm.slotDuration}
                onChange={(e) => setAvForm((f) => ({ ...f, slotDuration: Number(e.target.value) as SlotDuration }))}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SLOT_DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            className="mt-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSaveAvailability}
            disabled={
              avLoading ||
              clinics.length === 0 ||
              (avForm.repeatWeekly
                ? avForm.selectedDays.length === 0
                : !avForm.specificDate)
            }
          >
            {avLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-1 h-4 w-4" />
            {avForm.repeatWeekly
              ? `Add Recurring Slot${avForm.selectedDays.length > 1 ? "s" : ""}${
                  avForm.selectedDays.length > 0
                    ? ` (${avForm.selectedDays.length} day${avForm.selectedDays.length > 1 ? "s" : ""})`
                    : ""
                }`
              : "Add One-off Slot"}
          </Button>
          {clinics.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">Add a clinic first before setting availability.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Receptionists ────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Receptionists</h2>
        <Badge variant="outline" className="text-[10px]">Optional</Badge>
      </div>

      {/* Existing receptionists */}
      {receptionists.length > 0 && (
        <div className="grid gap-3">
          {receptionists.map((r) => {
            const { inviteState, myPerms } = pickMyState(r);
            const status = inviteState?.status ?? "invited";
            const statusVariant =
              status === "active" || status === "accepted"
                ? "success"
                : status === "rejected" || status === "expired"
                  ? "destructive"
                  : "warning";
            return (
              <Card key={r.uid}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.email}</p>
                      {r.phone && <p className="mt-0.5 text-xs text-muted-foreground">{r.phone}</p>}
                      <Badge variant={statusVariant} className="mt-1 text-[10px] capitalize">
                        {status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleUnlinkReceptionist(r.uid)}
                      title="Unlink from your practice"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Permissions */}
                  <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Permissions
                    </p>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {(
                        [
                          ["cancel", "Cancel appointments"],
                          ["reschedule", "Reschedule appointments"],
                          ["viewPatientDetails", "View patient details"],
                          ["manageQueue", "Manage queue"],
                          ["markCompletion", "Mark completion"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={myPerms[key]}
                            onChange={() => handleTogglePermission(r, key)}
                            className="h-3.5 w-3.5 rounded border-input"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add receptionist form */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Add Receptionist</p>
          </div>
          <div className="mb-3 inline-flex rounded-xl border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => {
                setRecMode("create");
                setRecLookup(null);
                setRecError("");
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                recMode === "create" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Create New
            </button>
            <button
              type="button"
              onClick={() => {
                setRecMode("link");
                setRecError("");
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                recMode === "link" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Link Existing
            </button>
          </div>

          {recError && (
            <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {recError}
            </div>
          )}
          {recTempPassword && (
            <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-500/30 dark:bg-green-500/10">
              <p className="font-semibold text-green-700 dark:text-green-400">Receptionist invited!</p>
              <p className="mt-1 text-green-600 dark:text-green-300">
                Email: <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs dark:bg-green-800">{recCreatedEmail}</code>
              </p>
              <p className="mt-1 text-green-600 dark:text-green-300">
                Temporary password: <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs dark:bg-green-800">{recTempPassword}</code>
              </p>
              <p className="mt-1 text-xs text-green-600/80 dark:text-green-400/80">
                Share these credentials with the receptionist. They must reset their password on first login.
              </p>
            </div>
          )}

          {recMode === "create" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Name" value={recForm.name} onChange={(e) => setRecForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Email" type="email" value={recForm.email} onChange={(e) => setRecForm((f) => ({ ...f, email: e.target.value }))} />
              <Input placeholder="Phone (optional)" value={recForm.phone} onChange={(e) => setRecForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Receptionist's email"
                  type="email"
                  value={recForm.email}
                  onChange={(e) => {
                    setRecForm((f) => ({ ...f, email: e.target.value }));
                    setRecLookup(null);
                  }}
                />
                <Button variant="outline" onClick={handleLookupEmail} disabled={recLoading}>
                  Search
                </Button>
              </div>
              {recLookup?.exists && recLookup.canLink && recLookup.profile && !recLookup.alreadyLinked && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-500/30 dark:bg-blue-500/10">
                  <p className="font-semibold text-blue-700 dark:text-blue-400">Found: {recLookup.profile.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">{recLookup.profile.email}</p>
                  {recLookup.profile.phone && (
                    <p className="text-xs text-blue-600 dark:text-blue-300">{recLookup.profile.phone}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {clinics.length > 0 && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-foreground">Assign to clinics</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {clinics.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClinicAssignment(c.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      recForm.clinicIds.includes(c.id)
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Initial permissions (for new invites) */}
          <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Initial permissions
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {(
                [
                  ["cancel", "Cancel appointments"],
                  ["reschedule", "Reschedule appointments"],
                  ["viewPatientDetails", "View patient details"],
                  ["manageQueue", "Manage queue"],
                  ["markCompletion", "Mark completion"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={recForm.permissions[key]}
                    onChange={() =>
                      setRecForm((f) => ({
                        ...f,
                        permissions: { ...f.permissions, [key]: !f.permissions[key] },
                      }))
                    }
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <Button
            className="mt-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmitReceptionist}
            disabled={recLoading || clinics.length === 0}
          >
            {recLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserPlus className="mr-1 h-4 w-4" />
            {recMode === "create" ? "Create & Invite" : "Link & Invite"}
          </Button>
          {clinics.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">Add a clinic first before adding a receptionist.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
