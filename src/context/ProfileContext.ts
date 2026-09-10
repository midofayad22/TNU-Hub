import { createContext } from "react";

export interface ProfileData {
  name: string;
  faculty: string;
  program: string;
  academicYear: string;
}

export interface ProfileContextValue {
  profile: ProfileData;

  updateProfile: (
    data: ProfileData,
  ) => Promise<void>;

  isLoading: boolean;

  error: string | null;

  reloadProfile: () => Promise<void>;
}

export const ProfileContext = createContext<
  ProfileContextValue | undefined
>(undefined);