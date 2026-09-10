import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { FormEvent } from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

interface Faculty {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at?: string;
  updated_at?: string;
}

interface Program {
  id: string;
  faculty_id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminPermission {
  id: string;
  admin_id: string;
  section: "faculties";
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

type ModalMode =
  | "none"
  | "faculty-create"
  | "faculty-edit"
  | "program-create"
  | "program-edit";

export default function AdminFaculties() {
  const { profile } = useAuth();

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [permissions, setPermissions] = useState<
    AdminPermission[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [permissionsLoading, setPermissionsLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [selectedFacultyId, setSelectedFacultyId] =
    useState<string | null>(null);

  const [modalMode, setModalMode] =
    useState<ModalMode>("none");

  const [facultyForm, setFacultyForm] = useState({
    id: "",
    name: "",
    description: "",
    icon: "",
  });

  const [programForm, setProgramForm] = useState({
    id: "",
    faculty_id: "",
    name: "",
    description: "",
  });

  const isRootAdmin = profile?.role === "root_admin";

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "root_admin";

  /*
   * =========================================================
   * LOAD PERMISSIONS
   * =========================================================
   */

  const loadPermissions = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    if (!isAdmin) {
      setPermissions([]);
      setPermissionsLoading(false);
      return;
    }

    if (isRootAdmin) {
      setPermissions([]);
      setPermissionsLoading(false);
      return;
    }

    setPermissionsLoading(true);

    try {
      const { data, error: permissionsError } =
        await supabase
          .from("admin_permissions")
          .select(
            "id, admin_id, section, can_view, can_add, can_edit, can_delete"
          )
          .eq("admin_id", profile.id)
          .eq("section", "faculties");

      if (permissionsError) {
        throw permissionsError;
      }

      setPermissions(
        (data ?? []) as AdminPermission[]
      );
    } catch (err) {
      console.error(
        "Admin faculties permissions error:",
        err
      );

      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [profile?.id, isAdmin, isRootAdmin]);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  /*
   * =========================================================
   * PERMISSION HELPERS
   * =========================================================
   */

  const canView = useCallback(() => {
    if (isRootAdmin) {
      return true;
    }

    return permissions.some(
      (permission) => permission.can_view
    );
  }, [isRootAdmin, permissions]);

  const canAdd = useCallback(() => {
    if (isRootAdmin) {
      return true;
    }

    return permissions.some(
      (permission) => permission.can_add
    );
  }, [isRootAdmin, permissions]);

  const canEdit = useCallback(() => {
    if (isRootAdmin) {
      return true;
    }

    return permissions.some(
      (permission) => permission.can_edit
    );
  }, [isRootAdmin, permissions]);

  const canDelete = useCallback(() => {
    if (isRootAdmin) {
      return true;
    }

    return permissions.some(
      (permission) => permission.can_delete
    );
  }, [isRootAdmin, permissions]);

  /*
   * =========================================================
   * LOAD DATA
   * =========================================================
   */

  const loadData = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    if (!isAdmin) {
      setFaculties([]);
      setPrograms([]);
      setSelectedFacultyId(null);
      setLoading(false);
      return;
    }

    /*
     * -------------------------------------------------------
     * DO NOT LOAD DATA BEFORE PERMISSION CHECK
     * -------------------------------------------------------
     */

    if (!isRootAdmin && permissionsLoading) {
      return;
    }

    if (!isRootAdmin && !canView()) {
      setFaculties([]);
      setPrograms([]);
      setSelectedFacultyId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        facultiesResult,
        programsResult,
      ] = await Promise.all([
        supabase
          .from("faculties")
          .select(
            "id, name, description, icon, created_at, updated_at"
          )
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("programs")
          .select(
            "id, faculty_id, name, description, created_at, updated_at"
          )
          .order("name", {
            ascending: true,
          }),
      ]);

      if (facultiesResult.error) {
        throw facultiesResult.error;
      }

      if (programsResult.error) {
        throw programsResult.error;
      }

      setFaculties(
        (facultiesResult.data ?? []) as Faculty[]
      );

      setPrograms(
        (programsResult.data ?? []) as Program[]
      );

      if (
        selectedFacultyId &&
        !(facultiesResult.data ?? []).some(
          (faculty) =>
            faculty.id === selectedFacultyId
        )
      ) {
        setSelectedFacultyId(null);
      }
    } catch (err) {
      console.error(
        "Admin faculties load error:",
        err
      );

      setError(
        "تعذر تحميل بيانات الكليات والبرامج. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }, [
    profile?.id,
    isAdmin,
    isRootAdmin,
    permissionsLoading,
    canView,
    selectedFacultyId,
  ]);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    if (!isRootAdmin && permissionsLoading) {
      return;
    }

    void loadData();
  }, [
    profile?.id,
    isRootAdmin,
    permissionsLoading,
    loadData,
  ]);

  /*
   * =========================================================
   * FILTERED DATA
   * =========================================================
   */

  const filteredFaculties = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return faculties;
    }

    return faculties.filter((faculty) => {
      const facultyPrograms = programs.filter(
        (program) =>
          program.faculty_id === faculty.id
      );

      return (
        faculty.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        faculty.description
          .toLowerCase()
          .includes(normalizedSearch) ||
        faculty.id
          .toLowerCase()
          .includes(normalizedSearch) ||
        facultyPrograms.some(
          (program) =>
            program.name
              .toLowerCase()
              .includes(normalizedSearch) ||
            program.description
              .toLowerCase()
              .includes(normalizedSearch)
        )
      );
    });
  }, [faculties, programs, search]);

  const selectedFaculty = useMemo(() => {
    return (
      faculties.find(
        (faculty) =>
          faculty.id === selectedFacultyId
      ) ?? null
    );
  }, [faculties, selectedFacultyId]);

  const selectedPrograms = useMemo(() => {
    if (!selectedFacultyId) {
      return [];
    }

    return programs.filter(
      (program) =>
        program.faculty_id === selectedFacultyId
    );
  }, [programs, selectedFacultyId]);

  /*
   * =========================================================
   * MODAL HELPERS
   * =========================================================
   */

  const closeModal = () => {
    if (saving || deleting) {
      return;
    }

    setModalMode("none");

    setFacultyForm({
      id: "",
      name: "",
      description: "",
      icon: "",
    });

    setProgramForm({
      id: "",
      faculty_id: "",
      name: "",
      description: "",
    });
  };

  const openCreateFaculty = () => {
    if (!canAdd()) {
      setError(
        "ليس لديك صلاحية لإضافة كلية."
      );
      return;
    }

    setError("");
    setSuccess("");

    setFacultyForm({
      id: "",
      name: "",
      description: "",
      icon: "",
    });

    setModalMode("faculty-create");
  };

  const openEditFaculty = (faculty: Faculty) => {
    if (!canEdit()) {
      setError(
        "ليس لديك صلاحية لتعديل الكليات."
      );
      return;
    }

    setError("");
    setSuccess("");

    setFacultyForm({
      id: faculty.id,
      name: faculty.name,
      description: faculty.description,
      icon: faculty.icon,
    });

    setModalMode("faculty-edit");
  };

  const openCreateProgram = (facultyId: string) => {
    if (!canAdd()) {
      setError(
        "ليس لديك صلاحية لإضافة برنامج."
      );
      return;
    }

    setError("");
    setSuccess("");

    setProgramForm({
      id: "",
      faculty_id: facultyId,
      name: "",
      description: "",
    });

    setModalMode("program-create");
  };

  const openEditProgram = (program: Program) => {
    if (!canEdit()) {
      setError(
        "ليس لديك صلاحية لتعديل البرامج."
      );
      return;
    }

    setError("");
    setSuccess("");

    setProgramForm({
      id: program.id,
      faculty_id: program.faculty_id,
      name: program.name,
      description: program.description,
    });

    setModalMode("program-edit");
  };

  /*
   * =========================================================
   * CREATE ACTION REQUEST
   * =========================================================
   */

  const createActionRequest = async ({
    action,
    targetId,
    payload,
    reason,
  }: {
    action: "add" | "edit" | "delete";
    targetId?: string | null;
    payload: unknown;
    reason: string;
  }) => {
    if (!profile?.id) {
      throw new Error(
        "لم يتم العثور على حساب المشرف."
      );
    }

    const { error: requestError } =
      await supabase
        .from("admin_action_requests")
        .insert({
          admin_id: profile.id,
          section: "faculties",
          action,
          target_id: targetId ?? null,
          payload,
          reason,
          status: "pending",
        });

    if (requestError) {
      throw requestError;
    }
  };

  /*
   * =========================================================
   * CREATE FACULTY
   * =========================================================
   */

  const createFaculty = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لإدارة الكليات."
      );
      return;
    }

    if (!canAdd()) {
      setError(
        "ليس لديك صلاحية لإضافة كلية."
      );
      return;
    }

    if (!facultyForm.id.trim()) {
      setError(
        "أدخل المعرّف الخاص بالكلية."
      );
      return;
    }

    if (!facultyForm.name.trim()) {
      setError("أدخل اسم الكلية.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      entity: "faculty",
      id: facultyForm.id.trim(),
      name: facultyForm.name.trim(),
      description:
        facultyForm.description.trim(),
      icon: facultyForm.icon.trim(),
    };

    try {
      if (!isRootAdmin) {
        await createActionRequest({
          action: "add",
          payload,
          reason:
            "طلب إضافة كلية جديدة من مشرف فرعي.",
        });

        setSuccess(
          "تم إرسال طلب إضافة الكلية إلى Root Admin للمراجعة."
        );

        closeModal();
        return;
      }

      const { error: insertError } =
        await supabase
          .from("faculties")
          .insert({
            id: payload.id,
            name: payload.name,
            description: payload.description,
            icon: payload.icon,
          });

      if (insertError) {
        throw insertError;
      }

      setSuccess(
        "تمت إضافة الكلية بنجاح."
      );

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error(
        "Create faculty error:",
        err
      );

      if (err?.code === "23505") {
        setError(
          "هذا المعرّف مستخدم بالفعل. اختر معرّفًا آخر."
        );
      } else {
        setError(
          "تعذر إضافة الكلية. حاول مرة أخرى."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * UPDATE FACULTY
   * =========================================================
   */

  const updateFaculty = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لتعديل الكليات."
      );
      return;
    }

    if (!canEdit()) {
      setError(
        "ليس لديك صلاحية لتعديل الكليات."
      );
      return;
    }

    if (!facultyForm.name.trim()) {
      setError("أدخل اسم الكلية.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      entity: "faculty",
      id: facultyForm.id,
      name: facultyForm.name.trim(),
      description:
        facultyForm.description.trim(),
      icon: facultyForm.icon.trim(),
    };

    try {
      if (!isRootAdmin) {
        await createActionRequest({
          action: "edit",
          targetId: facultyForm.id,
          payload,
          reason:
            "طلب تعديل بيانات كلية من مشرف فرعي.",
        });

        setSuccess(
          "تم إرسال طلب تعديل الكلية إلى Root Admin للمراجعة."
        );

        closeModal();
        return;
      }

      const { error: updateError } =
        await supabase
          .from("faculties")
          .update({
            name: payload.name,
            description: payload.description,
            icon: payload.icon,
          })
          .eq("id", facultyForm.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        "تم تحديث بيانات الكلية بنجاح."
      );

      closeModal();
      await loadData();
    } catch (err) {
      console.error(
        "Update faculty error:",
        err
      );

      setError(
        "تعذر تحديث الكلية. حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * CREATE PROGRAM
   * =========================================================
   */

  const createProgram = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لإدارة البرامج."
      );
      return;
    }

    if (!canAdd()) {
      setError(
        "ليس لديك صلاحية لإضافة برنامج."
      );
      return;
    }

    if (!programForm.id.trim()) {
      setError(
        "أدخل المعرّف الخاص بالبرنامج."
      );
      return;
    }

    if (!programForm.name.trim()) {
      setError("أدخل اسم البرنامج.");
      return;
    }

    if (!programForm.faculty_id) {
      setError(
        "اختر الكلية التابعة للبرنامج."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      entity: "program",
      id: programForm.id.trim(),
      faculty_id: programForm.faculty_id,
      name: programForm.name.trim(),
      description:
        programForm.description.trim(),
    };

    try {
      if (!isRootAdmin) {
        await createActionRequest({
          action: "add",
          payload,
          reason:
            "طلب إضافة برنامج أكاديمي من مشرف فرعي.",
        });

        setSuccess(
          "تم إرسال طلب إضافة البرنامج إلى Root Admin للمراجعة."
        );

        closeModal();
        return;
      }

      const { error: insertError } =
        await supabase
          .from("programs")
          .insert({
            id: payload.id,
            faculty_id: payload.faculty_id,
            name: payload.name,
            description: payload.description,
          });

      if (insertError) {
        throw insertError;
      }

      setSuccess(
        "تمت إضافة البرنامج بنجاح."
      );

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error(
        "Create program error:",
        err
      );

      if (err?.code === "23505") {
        setError(
          "هذا المعرّف مستخدم بالفعل. اختر معرّفًا آخر."
        );
      } else {
        setError(
          "تعذر إضافة البرنامج. حاول مرة أخرى."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * UPDATE PROGRAM
   * =========================================================
   */

  const updateProgram = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لتعديل البرامج."
      );
      return;
    }

    if (!canEdit()) {
      setError(
        "ليس لديك صلاحية لتعديل البرامج."
      );
      return;
    }

    if (!programForm.name.trim()) {
      setError("أدخل اسم البرنامج.");
      return;
    }

    if (!programForm.faculty_id) {
      setError(
        "اختر الكلية التابعة للبرنامج."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      entity: "program",
      id: programForm.id,
      faculty_id: programForm.faculty_id,
      name: programForm.name.trim(),
      description:
        programForm.description.trim(),
    };

    try {
      if (!isRootAdmin) {
        await createActionRequest({
          action: "edit",
          targetId: programForm.id,
          payload,
          reason:
            "طلب تعديل برنامج أكاديمي من مشرف فرعي.",
        });

        setSuccess(
          "تم إرسال طلب تعديل البرنامج إلى Root Admin للمراجعة."
        );

        closeModal();
        return;
      }

      const { error: updateError } =
        await supabase
          .from("programs")
          .update({
            faculty_id: payload.faculty_id,
            name: payload.name,
            description: payload.description,
          })
          .eq("id", programForm.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        "تم تحديث البرنامج بنجاح."
      );

      closeModal();
      await loadData();
    } catch (err) {
      console.error(
        "Update program error:",
        err
      );

      setError(
        "تعذر تحديث البرنامج. حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * DELETE FACULTY
   * =========================================================
   */

  const deleteFaculty = async (
    faculty: Faculty
  ) => {
    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لحذف الكليات."
      );
      return;
    }

    if (!canDelete()) {
      setError(
        "ليس لديك صلاحية لحذف الكليات."
      );
      return;
    }

    const facultyPrograms = programs.filter(
      (program) =>
        program.faculty_id === faculty.id
    );

    const message =
      facultyPrograms.length > 0
        ? `سيتم حذف كلية "${faculty.name}" وجميع البرامج التابعة لها. هل تريد المتابعة؟`
        : `هل تريد حذف كلية "${faculty.name}"؟`;

    const confirmed =
      window.confirm(message);

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      /*
       * -------------------------------------------------------
       * SUB ADMIN
       * -------------------------------------------------------
       */

      if (!isRootAdmin) {
        await createActionRequest({
          action: "delete",
          targetId: faculty.id,
          payload: {
            entity: "faculty",

            faculty: {
              id: faculty.id,
              name: faculty.name,
              description: faculty.description,
              icon: faculty.icon,
            },

            programs: facultyPrograms.map(
              (program) => ({
                id: program.id,
                faculty_id:
                  program.faculty_id,
                name: program.name,
                description:
                  program.description,
              })
            ),
          },
          reason:
            facultyPrograms.length > 0
              ? "طلب حذف كلية وجميع البرامج التابعة لها من مشرف فرعي."
              : "طلب حذف كلية من مشرف فرعي.",
        });

        setSuccess(
          "تم إرسال طلب حذف الكلية إلى Root Admin للمراجعة."
        );

        return;
      }

      /*
       * -------------------------------------------------------
       * ROOT ADMIN
       * -------------------------------------------------------
       */

      if (facultyPrograms.length > 0) {
        const {
          error: programsDeleteError,
        } = await supabase
          .from("programs")
          .delete()
          .eq(
            "faculty_id",
            faculty.id
          );

        if (programsDeleteError) {
          throw programsDeleteError;
        }
      }

      const {
        error: facultyDeleteError,
      } = await supabase
        .from("faculties")
        .delete()
        .eq("id", faculty.id);

      if (facultyDeleteError) {
        throw facultyDeleteError;
      }

      if (
        selectedFacultyId === faculty.id
      ) {
        setSelectedFacultyId(null);
      }

      setSuccess(
        "تم حذف الكلية بنجاح."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Delete faculty error:",
        err
      );

      setError(
        "تعذر حذف الكلية. قد تكون مرتبطة ببيانات أخرى."
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * =========================================================
   * DELETE PROGRAM
   * =========================================================
   */

  const deleteProgram = async (
    program: Program
  ) => {
    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لحذف البرامج."
      );
      return;
    }

    if (!canDelete()) {
      setError(
        "ليس لديك صلاحية لحذف البرامج."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد حذف برنامج "${program.name}"؟`
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      /*
       * -------------------------------------------------------
       * SUB ADMIN
       * -------------------------------------------------------
       */

      if (!isRootAdmin) {
        await createActionRequest({
          action: "delete",
          targetId: program.id,
          payload: {
            entity: "program",
            id: program.id,
            faculty_id:
              program.faculty_id,
            name: program.name,
            description:
              program.description,
          },
          reason:
            "طلب حذف برنامج أكاديمي من مشرف فرعي.",
        });

        setSuccess(
          "تم إرسال طلب حذف البرنامج إلى Root Admin للمراجعة."
        );

        return;
      }

      /*
       * -------------------------------------------------------
       * ROOT ADMIN
       * -------------------------------------------------------
       */

      const { error: deleteError } =
        await supabase
          .from("programs")
          .delete()
          .eq("id", program.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess(
        "تم حذف البرنامج بنجاح."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Delete program error:",
        err
      );

      setError(
        "تعذر حذف البرنامج. حاول مرة أخرى."
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * =========================================================
   * PROFILE GUARD
   * =========================================================
   */

  if (!profile) {
    return null;
  }

  /*
   * =========================================================
   * ACCESS GUARD
   * =========================================================
   */

  if (!isRootAdmin && !isAdmin) {
    return (
      <div
        className="admin-page admin-faculties-page"
        dir="rtl"
      >
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <ShieldCheck size={32} />

            <h2>
              لا تملك صلاحية الوصول
            </h2>

            <p>
              إدارة الكليات والبرامج متاحة
              للمشرفين فقط.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (
    !isRootAdmin &&
    !permissionsLoading &&
    !canView()
  ) {
    return (
      <div
        className="admin-page admin-faculties-page"
        dir="rtl"
      >
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <ShieldCheck size={32} />

            <h2>
              لا تملك صلاحية الوصول
            </h2>

            <p>
              حسابك كمشرف لا يملك صلاحية
              عرض قسم الكليات والبرامج.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <div
      className="admin-page admin-faculties-page"
      dir="rtl"
    >
      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            الإدارة الأكاديمية
          </span>

          <h1>
            الكليات والبرامج
          </h1>

          <p>
            إدارة الكليات والبرامج الأكاديمية
            في منصة TNU Hub من مكان واحد.
          </p>
        </div>

        <div className="admin-page__header-actions">
          {canAdd() && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={openCreateFaculty}
            >
              <Plus size={18} />

              <span>
                {isRootAdmin
                  ? "إضافة كلية"
                  : "طلب إضافة كلية"}
              </span>
            </button>
          )}

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-spin"
                  : ""
              }
            />

            <span>تحديث</span>
          </button>
        </div>
      </section>

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            className="admin-alert__retry"
            onClick={() => {
              setError("");
              void loadData();
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {success && (
        <div
          className="admin-alert admin-alert--success"
          role="status"
        >
          <CheckCircle2 size={18} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="admin-alert__close"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="admin-stats-grid admin-faculties-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <span>الكليات</span>

            <div className="admin-stat-card__icon">
              <Building2 size={19} />
            </div>
          </div>

          <div className="admin-stat-card__value">
            {loading
              ? "..."
              : faculties.length}
          </div>

          <div className="admin-stat-card__bottom">
            <span>
              إجمالي الكليات المسجلة
            </span>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <span>البرامج</span>

            <div className="admin-stat-card__icon">
              <BookOpen size={19} />
            </div>
          </div>

          <div className="admin-stat-card__value">
            {loading
              ? "..."
              : programs.length}
          </div>

          <div className="admin-stat-card__bottom">
            <span>
              إجمالي البرامج الأكاديمية
            </span>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-faculties-grid">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                الكليات
              </span>

              <h2>
                قائمة الكليات
              </h2>
            </div>

            <span className="admin-status admin-status--completed">
              {faculties.length} كلية
            </span>
          </div>

          <div className="admin-faculties-toolbar">
            <div className="admin-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="ابحث عن كلية أو برنامج..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="مسح البحث"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              <Loader2
                size={28}
                className="admin-spin"
              />

              <h2>
                جاري تحميل الكليات
              </h2>

              <p>
                يتم جلب البيانات من قاعدة
                البيانات.
              </p>
            </div>
          ) : filteredFaculties.length ===
            0 ? (
            <div className="admin-empty-state">
              <Building2 size={28} />

              <h2>
                {search
                  ? "لا توجد نتائج"
                  : "لا توجد كليات"}
              </h2>

              <p>
                {search
                  ? "جرّب البحث باستخدام اسم كلية أو برنامج مختلف."
                  : "ابدأ بإضافة أول كلية إلى المنصة."}
              </p>

              {!search &&
                canAdd() && (
                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={
                      openCreateFaculty
                    }
                  >
                    <Plus size={17} />

                    {isRootAdmin
                      ? "إضافة كلية"
                      : "طلب إضافة كلية"}
                  </button>
                )}
            </div>
          ) : (
            <div className="admin-faculties-list">
              {filteredFaculties.map(
                (faculty) => {
                  const facultyPrograms =
                    programs.filter(
                      (program) =>
                        program.faculty_id ===
                        faculty.id
                    );

                  const selected =
                    selectedFacultyId ===
                    faculty.id;

                  return (
                    <article
                      key={faculty.id}
                      className={`admin-faculty-item ${
                        selected
                          ? "admin-faculty-item--active"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="admin-faculty-item__main"
                        onClick={() =>
                          setSelectedFacultyId(
                            selected
                              ? null
                              : faculty.id
                          )
                        }
                      >
                        <div className="admin-faculty-item__icon">
                          {faculty.icon || (
                            <Building2
                              size={20}
                            />
                          )}
                        </div>

                        <div className="admin-faculty-item__content">
                          <strong>
                            {faculty.name}
                          </strong>

                          <span>
                            {faculty.description ||
                              "لا يوجد وصف للكلية."}
                          </span>

                          <small>
                            {
                              facultyPrograms.length
                            }{" "}
                            برنامج
                          </small>
                        </div>
                      </button>

                      <div className="admin-faculty-item__actions">
                        {canEdit() && (
                          <button
                            type="button"
                            className="admin-icon-button"
                            title="تعديل الكلية"
                            onClick={() =>
                              openEditFaculty(
                                faculty
                              )
                            }
                          >
                            <Edit3 size={16} />
                          </button>
                        )}

                        {canDelete() && (
                          <button
                            type="button"
                            className="admin-icon-button admin-icon-button--danger"
                            title="حذف الكلية"
                            onClick={() =>
                              void deleteFaculty(
                                faculty
                              )
                            }
                            disabled={
                              deleting
                            }
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                البرامج الأكاديمية
              </span>

              <h2>
                {selectedFaculty
                  ? selectedFaculty.name
                  : "اختر كلية"}
              </h2>
            </div>

            {selectedFaculty &&
              canAdd() && (
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    openCreateProgram(
                      selectedFaculty.id
                    )
                  }
                >
                  <Plus size={17} />

                  {isRootAdmin
                    ? "إضافة برنامج"
                    : "طلب إضافة برنامج"}
                </button>
              )}
          </div>

          {!selectedFaculty ? (
            <div className="admin-empty-state">
              <BookOpen size={30} />

              <h2>
                اختر كلية لعرض برامجها
              </h2>

              <p>
                اضغط على أي كلية من القائمة
                لعرض البرامج الأكاديمية التابعة
                لها.
              </p>
            </div>
          ) : selectedPrograms.length ===
            0 ? (
            <div className="admin-empty-state">
              <BookOpen size={30} />

              <h2>
                لا توجد برامج
              </h2>

              <p>
                لم تتم إضافة برامج لهذه الكلية
                حتى الآن.
              </p>

              {canAdd() && (
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    openCreateProgram(
                      selectedFaculty.id
                    )
                  }
                >
                  <Plus size={17} />

                  {isRootAdmin
                    ? "إضافة أول برنامج"
                    : "طلب إضافة برنامج"}
                </button>
              )}
            </div>
          ) : (
            <div className="admin-programs-list">
              {selectedPrograms.map(
                (program) => (
                  <article
                    key={program.id}
                    className="admin-program-item"
                  >
                    <div className="admin-program-item__icon">
                      <BookOpen size={18} />
                    </div>

                    <div className="admin-program-item__content">
                      <strong>
                        {program.name}
                      </strong>

                      <span>
                        {program.description ||
                          "لا يوجد وصف للبرنامج."}
                      </span>

                      <small>
                        {program.id}
                      </small>
                    </div>

                    <div className="admin-program-item__actions">
                      {canEdit() && (
                        <button
                          type="button"
                          className="admin-icon-button"
                          title="تعديل البرنامج"
                          onClick={() =>
                            openEditProgram(
                              program
                            )
                          }
                        >
                          <Edit3 size={16} />
                        </button>
                      )}

                      {canDelete() && (
                        <button
                          type="button"
                          className="admin-icon-button admin-icon-button--danger"
                          title="حذف البرنامج"
                          onClick={() =>
                            void deleteProgram(
                              program
                            )
                          }
                          disabled={
                            deleting
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          ADMIN MODAL
      ===================================================== */}

      {modalMode !== "none" && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal__header">
              <div>
                <span className="admin-panel__kicker">
                  {modalMode.includes(
                    "faculty"
                  )
                    ? "إدارة الكليات"
                    : "إدارة البرامج"}
                </span>

                <h2>
                  {modalMode ===
                  "faculty-create"
                    ? isRootAdmin
                      ? "إضافة كلية جديدة"
                      : "طلب إضافة كلية جديدة"
                    : modalMode ===
                      "faculty-edit"
                    ? "تعديل بيانات الكلية"
                    : modalMode ===
                      "program-create"
                    ? isRootAdmin
                      ? "إضافة برنامج جديد"
                      : "طلب إضافة برنامج جديد"
                    : "تعديل بيانات البرنامج"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal__close"
                onClick={closeModal}
                disabled={saving}
                aria-label="إغلاق"
              >
                <X size={19} />
              </button>
            </div>

            {modalMode.includes(
              "faculty"
            ) ? (
              <form
                className="admin-form"
                onSubmit={
                  modalMode ===
                  "faculty-create"
                    ? createFaculty
                    : updateFaculty
                }
              >
                {modalMode ===
                  "faculty-create" && (
                  <label className="admin-form__field">
                    <span>
                      معرّف الكلية
                    </span>

                    <input
                      type="text"
                      value={
                        facultyForm.id
                      }
                      onChange={(event) =>
                        setFacultyForm(
                          (current) => ({
                            ...current,
                            id: event.target.value
                              .trim()
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              ),
                          })
                        )
                      }
                      placeholder="مثال: engineering"
                      required
                    />

                    <small>
                      يجب أن يكون المعرّف
                      فريدًا ويُفضّل استخدام
                      الإنجليزية بدون مسافات.
                    </small>
                  </label>
                )}

                <label className="admin-form__field">
                  <span>
                    اسم الكلية
                  </span>

                  <input
                    type="text"
                    value={
                      facultyForm.name
                    }
                    onChange={(event) =>
                      setFacultyForm(
                        (current) => ({
                          ...current,
                          name: event.target
                            .value,
                        })
                      )
                    }
                    placeholder="مثال: كلية الهندسة"
                    required
                  />
                </label>

                <label className="admin-form__field">
                  <span>
                    الوصف
                  </span>

                  <textarea
                    value={
                      facultyForm.description
                    }
                    onChange={(event) =>
                      setFacultyForm(
                        (current) => ({
                          ...current,
                          description:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="اكتب وصفًا مختصرًا للكلية..."
                    rows={4}
                  />
                </label>

                <label className="admin-form__field">
                  <span>
                    الأيقونة
                  </span>

                  <input
                    type="text"
                    value={
                      facultyForm.icon
                    }
                    onChange={(event) =>
                      setFacultyForm(
                        (current) => ({
                          ...current,
                          icon: event.target
                            .value,
                        })
                      )
                    }
                    placeholder="مثال: هـ"
                  />
                </label>

                <div className="admin-modal__actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2
                        size={17}
                        className="admin-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )}

                    {saving
                      ? "جاري الحفظ..."
                      : modalMode ===
                        "faculty-create"
                      ? isRootAdmin
                        ? "إضافة الكلية"
                        : "إرسال الطلب"
                      : isRootAdmin
                      ? "حفظ التعديلات"
                      : "إرسال طلب التعديل"}
                  </button>
                </div>
              </form>
            ) : (
              <form
                className="admin-form"
                onSubmit={
                  modalMode ===
                  "program-create"
                    ? createProgram
                    : updateProgram
                }
              >
                {modalMode ===
                  "program-create" && (
                  <label className="admin-form__field">
                    <span>
                      معرّف البرنامج
                    </span>

                    <input
                      type="text"
                      value={
                        programForm.id
                      }
                      onChange={(event) =>
                        setProgramForm(
                          (current) => ({
                            ...current,
                            id: event.target.value
                              .trim()
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              ),
                          })
                        )
                      }
                      placeholder="مثال: computer-engineering"
                      required
                    />

                    <small>
                      يجب أن يكون المعرّف
                      فريدًا.
                    </small>
                  </label>
                )}

                <label className="admin-form__field">
                  <span>
                    الكلية
                  </span>

                  <select
                    value={
                      programForm.faculty_id
                    }
                    onChange={(event) =>
                      setProgramForm(
                        (current) => ({
                          ...current,
                          faculty_id:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  >
                    <option value="">
                      اختر الكلية
                    </option>

                    {faculties.map(
                      (faculty) => (
                        <option
                          key={faculty.id}
                          value={
                            faculty.id
                          }
                        >
                          {faculty.name}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="admin-form__field">
                  <span>
                    اسم البرنامج
                  </span>

                  <input
                    type="text"
                    value={
                      programForm.name
                    }
                    onChange={(event) =>
                      setProgramForm(
                        (current) => ({
                          ...current,
                          name: event.target
                            .value,
                        })
                      )
                    }
                    placeholder="مثال: هندسة الحاسب"
                    required
                  />
                </label>

                <label className="admin-form__field">
                  <span>
                    الوصف
                  </span>

                  <textarea
                    value={
                      programForm.description
                    }
                    onChange={(event) =>
                      setProgramForm(
                        (current) => ({
                          ...current,
                          description:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="اكتب وصفًا مختصرًا للبرنامج..."
                    rows={4}
                  />
                </label>

                <div className="admin-modal__actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2
                        size={17}
                        className="admin-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )}

                    {saving
                      ? "جاري الحفظ..."
                      : modalMode ===
                        "program-create"
                      ? isRootAdmin
                        ? "إضافة البرنامج"
                        : "إرسال الطلب"
                      : isRootAdmin
                      ? "حفظ التعديلات"
                      : "إرسال طلب التعديل"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}