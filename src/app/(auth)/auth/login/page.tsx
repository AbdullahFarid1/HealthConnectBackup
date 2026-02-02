"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
    }
  };

  const sendOtp = async () => {
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
    setConfirmation(confirmationResult);
  };

  const verifyOtp = async () => {
    const result = await confirmation.confirm(otp);
    const idToken = await result.user.getIdToken();

    await fetch("/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken }),
      headers: { "Content-Type": "application/json" },
    });

    window.location.href = "/app";
  };

  return (
    <div>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92..." />
      <button onClick={sendOtp}>Send OTP</button>

      {confirmation && (
        <>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP" />
          <button onClick={verifyOtp}>Verify</button>
        </>
      )}
      <div id="recaptcha-container" />
    </div>
  );
}
