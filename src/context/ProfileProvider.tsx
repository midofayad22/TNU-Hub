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
  const savedProfile = localStorage.getItem(storageKey);

  if (!savedProfile) {
    return { ...emptyProfile };
  }

  try {
    const parsed: unknown = JSON.parse(savedProfile);

    if (
      typeof parsed === "object" &&
      parsed !== null
    ) {
      const data =
        parsed as Record<string, unknown>;

      return {
        name:
          typeof data.name === "string"
            ? data.name
            : "",

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
    }
  } catch {
    localStorage.removeItem(storageKey);
  }

  return { ...emptyProfile };
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

    localStorage.setItem(
      storageKey,
      JSON.stringify(data)
    );
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