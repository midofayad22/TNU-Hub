import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  ProfileContext,
  type ProfileData,
} from "./ProfileContext";

import { supabase } from "../lib/supabase";

const emptyProfile: ProfileData = {
  name: "",
  faculty: "",
  program: "",
  academicYear: "",
};

export function ProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<ProfileData>(emptyProfile);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Load the authenticated user's profile
   * from the Supabase profiles table.
   */
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Failed to get authenticated user:",
          userError,
        );

        setProfile(emptyProfile);
        setError(
          "تعذر الحصول على بيانات المستخدم.",
        );

        return;
      }

      if (!user) {
        setProfile(emptyProfile);
        return;
      }

      const { data, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "full_name, faculty, program, academic_year",
          )
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Failed to load profile:",
          profileError,
        );

        setError(
          "تعذر تحميل بيانات الملف الشخصي.",
        );

        return;
      }

      /**
       * If the profile row does not exist yet,
       * use the name stored in Supabase Auth metadata
       * as a temporary fallback.
       */
      if (!data) {
        setProfile({
          ...emptyProfile,
          name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            "",
        });

        return;
      }

      setProfile({
        name: data.full_name ?? "",
        faculty: data.faculty ?? "",
        program: data.program ?? "",
        academicYear: data.academic_year ?? "",
      });
    } catch (error) {
      console.error(
        "Unexpected error while loading profile:",
        error,
      );

      setError(
        "حدث خطأ غير متوقع أثناء تحميل الملف الشخصي.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load the profile when the provider mounts.
   */
  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  /**
   * Update the authenticated user's profile
   * inside the Supabase profiles table.
   */
  const updateProfile = useCallback(
    async (data: ProfileData): Promise<void> => {
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Failed to get authenticated user:",
            userError,
          );

          setError(
            "تعذر التحقق من حساب المستخدم.",
          );

          throw userError;
        }

        if (!user) {
          const authError = new Error(
            "User is not authenticated.",
          );

          console.error(
            "Cannot update profile:",
            authError,
          );

          setError(
            "يجب تسجيل الدخول حتى تتمكن من تعديل الملف الشخصي.",
          );

          throw authError;
        }

        const cleanedProfile: ProfileData = {
          name: data.name.trim(),
          faculty: data.faculty.trim(),
          program: data.program.trim(),
          academicYear:
            data.academicYear.trim(),
        };

        const { error: updateError } =
          await supabase
            .from("profiles")
            .update({
              full_name: cleanedProfile.name,
              faculty: cleanedProfile.faculty,
              program: cleanedProfile.program,
              academic_year:
                cleanedProfile.academicYear,
            })
            .eq("id", user.id);

        if (updateError) {
          console.error(
            "Failed to update profile:",
            updateError,
          );

          setError(
            "تعذر حفظ بيانات الملف الشخصي.",
          );

          throw updateError;
        }

        /**
         * Update the local state only after
         * Supabase confirms that the update succeeded.
         */
        setProfile(cleanedProfile);
      } catch (error) {
        console.error(
          "Unexpected error while updating profile:",
          error,
        );

        throw error;
      }
    },
    [],
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        isLoading,
        error,
        reloadProfile: loadProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}