"use client";

import { useEffect, useState } from "react";

type ViewportProfile = {
  width: number;
  height: number;
  isPhone: boolean;
  isTablet: boolean;
  isMobileOrTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isWideDesktop: boolean;
  isShortViewport: boolean;
  isLowHeightDesktop: boolean;
  isDenseDesktop: boolean;
  supportsFullscreenStage: boolean;
  supportsPinnedScene: boolean;
};

function readViewportProfile(): ViewportProfile {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
      isPhone: false,
      isTablet: false,
      isMobileOrTablet: false,
      isLaptop: false,
      isDesktop: false,
      isWideDesktop: false,
      isShortViewport: false,
      isLowHeightDesktop: false,
      isDenseDesktop: false,
      supportsFullscreenStage: false,
      supportsPinnedScene: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPhone = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isMobileOrTablet = width < 1024;
  const isLaptop = width >= 1024 && width < 1440;
  const isDesktop = width >= 1024;
  const isWideDesktop = width >= 1440;
  const isShortViewport = height <= 900;
  const isLowHeightDesktop = width >= 1024 && height <= 940;
  const isDenseDesktop = width >= 1024 && height <= 980;
  const supportsFullscreenStage = width >= 1024 && height >= 760;
  const supportsPinnedScene = width >= 1440 && height >= 860;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isMobileOrTablet,
    isLaptop,
    isDesktop,
    isWideDesktop,
    isShortViewport,
    isLowHeightDesktop,
    isDenseDesktop,
    supportsFullscreenStage,
    supportsPinnedScene,
  };
}

export function useViewportProfile() {
  const [profile, setProfile] = useState<ViewportProfile>(readViewportProfile);

  useEffect(() => {
    const syncProfile = () => {
      setProfile(readViewportProfile());
    };

    syncProfile();
    window.addEventListener("resize", syncProfile, { passive: true });

    return () => {
      window.removeEventListener("resize", syncProfile);
    };
  }, []);

  return profile;
}
