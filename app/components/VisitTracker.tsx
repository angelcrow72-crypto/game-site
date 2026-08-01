"use client";

import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
    }).catch((error) => {
      console.error("Visit tracking failed:", error);
    });
  }, []);

  return null;
}