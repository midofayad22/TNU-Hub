import {
  useState,
  type ReactNode,
} from "react";

import {
  ProfileContext,
  type ProfileData,
} from "./ProfileContext";

const emptyProfile: ProfileData = {
  name: "",
  faculty: "",
  program: "",
  academicYear: "",
};

const storageKey = "student-platform-profile";

const loadProfile = (): ProfileData => {
  if (typeof window === "undefined") {
    return { ...emptyProfile };
  }

  try {
    const savedProfile = localStorage.getItem(storageKey);

    if (!savedProfile) {
      return { ...emptyProfile };
    }

    const parsed: unknown = JSON.parse(savedProfile);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      localStorage.removeItem(storageKey);
      return { ...emptyProfile };
    }

    const data = parsed as Record<string, unknown>;

    return {
      name: typeof data.name === "string" ? data.name : "",
      faculty:
        typeof data.faculty === "string"
          ? data.faculty
          : "",
      program:
        typeof data.program === "string"
          ? data.program
          : "",
      academicYear:
        typeof data.academicYear === "string"
          ? data.academicYear
          : "",
    };
  } catch (error) {
    console.error("Failed to load local profile:", error);

    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage cleanup errors.
    }

    return { ...emptyProfile };
  }
};

export function ProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<ProfileData>(loadProfile);

  const updateProfile = (data: ProfileData) => {
    setProfile(data);

    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "Failed to save local profile:",
        error
      );
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}