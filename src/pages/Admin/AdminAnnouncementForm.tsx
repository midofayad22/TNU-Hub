import {
  ArrowRight,
  CalendarDays,
  Megaphone,
  Save,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type AnnouncementStatus = "منشور" | "مسودة";

interface AnnouncementTarget {
  type: "all" | "program" | "faculty" | "year";
  value?: string;
}

interface AnnouncementRecord {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  target: AnnouncementTarget | null;
  status: AnnouncementStatus;
}

interface StudentProfile {
  id: string;
  role: string | null;
  faculty: string | null;
  program: string | null;
  academic_year: string | null;
}

interface Program {
  id: string;
  name: string;
}

export default function AdminAnnouncementForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { profile } = useAuth();

  const isEditMode = Boolean(id);
  const isRootAdmin = profile?.role === "root_admin";

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState("أكاديمي");

  /*
   * القيمة هنا هي اسم البرنامج المختار.
   * "جميع الطلاب" هي القيمة الخاصة بالاستهداف العام.
   */
  const [target, setTarget] =
    useState("جميع الطلاب");

  const [date, setDate] = useState("");
  const [content, setContent] = useState("");

  const [status, setStatus] =
    useState<AnnouncementStatus>("منشور");

  const [programs, setPrograms] =
    useState<Program[]>([]);

  const [programsLoading, setProgramsLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(isEditMode);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  /*
   * =========================================================
   * LOAD PROGRAMS
   * =========================================================
   */

  useEffect(() => {
    const loadPrograms = async () => {
      setProgramsLoading(true);

      const {
        data,
        error: programsError,
      } = await supabase
        .from("programs")
        .select("id, name")
        .order("name", {
          ascending: true,
        });

      if (programsError) {
        console.error(
          "Failed to load programs:",
          programsError
        );

        setPrograms([]);
        setProgramsLoading(false);

        return;
      }

      setPrograms(
        (data ?? []).map((program) => ({
          id: String(program.id),
          name: String(program.name),
        }))
      );

      setProgramsLoading(false);
    };

    loadPrograms();
  }, []);

  /*
   * =========================================================
   * LOAD PERMISSIONS
   * =========================================================
   */

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    if (isRootAdmin) {
      setCanAdd(true);
      setCanEdit(true);

      return;
    }

    const loadPermissions = async () => {
      const {
        data,
        error: permissionError,
      } = await supabase
        .from("admin_permissions")
        .select(
          "can_add, can_edit, can_view"
        )
        .eq("admin_id", profile.id)
        .eq("section", "announcements")
        .maybeSingle();

      if (permissionError) {
        console.error(
          "Failed to load announcement permissions:",
          permissionError
        );

        setCanAdd(false);
        setCanEdit(false);

        return;
      }

      if (!data?.can_view) {
        setError(
          "لا تملك صلاحية الوصول إلى قسم الإعلانات."
        );
      }

      setCanAdd(Boolean(data?.can_add));
      setCanEdit(Boolean(data?.can_edit));
    };

    loadPermissions();
  }, [profile?.id, isRootAdmin]);

  /*
   * =========================================================
   * LOAD ANNOUNCEMENT FOR EDIT
   * =========================================================
   */

  useEffect(() => {
    if (!isEditMode || !id) {
      const today = new Date()
        .toISOString()
        .split("T")[0];

      setDate(today);
      setLoading(false);

      return;
    }

    const loadAnnouncement = async () => {
      setLoading(true);
      setError("");

      const {
        data,
        error: fetchError,
      } = await supabase
        .from("announcements")
        .select(
          `
            id,
            title,
            category,
            content,
            date,
            target,
            status
          `
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error(
          "Failed to load announcement:",
          fetchError
        );

        setError(
          "تعذر تحميل الإعلان. ربما تم حذفه أو أن الرابط غير صحيح."
        );

        setLoading(false);

        return;
      }

      const announcement =
        data as AnnouncementRecord;

      setTitle(announcement.title ?? "");

      setCategory(
        announcement.category ?? "أكاديمي"
      );

      setContent(
        announcement.content ?? ""
      );

      setDate(announcement.date ?? "");

      setStatus(
        announcement.status ?? "منشور"
      );

      /*
       * =====================================================
       * LOAD TARGET
       * =====================================================
       */

      if (!announcement.target) {
        setTarget("جميع الطلاب");
      } else if (
        announcement.target.type === "program"
      ) {
        setTarget(
          announcement.target.value ||
            "جميع الطلاب"
        );
      } else if (
        announcement.target.type === "faculty"
      ) {
        /*
         * بيانات قديمة.
         */
        setTarget(
          announcement.target.value ||
            "جميع الطلاب"
        );
      } else if (
        announcement.target.type === "year"
      ) {
        /*
         * بيانات قديمة.
         */
        setTarget(
          announcement.target.value ||
            "جميع الطلاب"
        );
      } else {
        setTarget("جميع الطلاب");
      }

      setLoading(false);
    };

    loadAnnouncement();
  }, [id, isEditMode]);

  /*
   * =========================================================
   * TARGET CONVERSION
   * =========================================================
   */

  const buildTarget = (): AnnouncementTarget => {
    if (target === "جميع الطلاب") {
      return {
        type: "all",
      };
    }

    return {
      type: "program",
      value: target,
    };
  };

  /*
   * =========================================================
   * CREATE STUDENT NOTIFICATIONS
   * =========================================================
   */

  const createNotificationsForAnnouncement =
    async (
      announcementTitle: string,
      announcementContent: string,
      announcementTarget: AnnouncementTarget
    ) => {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, role, faculty, program, academic_year"
        );

      if (profilesError) {
        console.error(
          "Failed to load profiles for notifications:",
          profilesError
        );

        throw new Error(
          "تم نشر الإعلان، لكن تعذر جلب الطلاب المستهدفين."
        );
      }

      const targetValue =
        announcementTarget.value?.trim();

      const students =
        (profiles ?? []).filter(
          (student: StudentProfile) => {
            /*
             * استبعاد حسابات الإدارة.
             */
            if (
              student.role === "admin" ||
              student.role === "root_admin"
            ) {
              return false;
            }

            /*
             * جميع الطلاب.
             */
            if (
              announcementTarget.type === "all"
            ) {
              return true;
            }

            /*
             * استهداف برنامج محدد.
             */
            if (
              announcementTarget.type ===
              "program"
            ) {
              return (
                Boolean(targetValue) &&
                student.program?.trim() ===
                  targetValue
              );
            }

            /*
             * دعم البيانات القديمة.
             */
            if (
              announcementTarget.type ===
              "faculty"
            ) {
              return (
                student.faculty?.trim() ===
                  targetValue ||
                student.program?.trim() ===
                  targetValue
              );
            }

            /*
             * إعلان قديم يستهدف السنة الدراسية.
             */
            if (
              announcementTarget.type === "year"
            ) {
              return (
                student.academic_year?.trim() ===
                targetValue
              );
            }

            return false;
          }
        );

      if (students.length === 0) {
        console.warn(
          "No students matched announcement target:",
          announcementTarget
        );

        return;
      }

      const notifications = students.map(
        (student: StudentProfile) => ({
          user_id: student.id,
          title: announcementTitle,
          message: announcementContent,
          type: "announcement",
          is_read: false,
        })
      );

      const {
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationsError) {
        console.error(
          "Failed to create announcement notifications:",
          notificationsError
        );

        throw new Error(
          "تم نشر الإعلان، لكن تعذر إنشاء إشعارات الطلاب."
        );
      }

      console.log(
        `Created ${notifications.length} announcement notifications.`
      );
    };

  /*
   * =========================================================
   * CREATE ACTION REQUEST
   * =========================================================
   */

  const createActionRequest = async (
    userId: string,
    action: "add" | "edit"
  ) => {
    const payload = {
      title: title.trim(),
      category,
      content: content.trim(),
      date,
      target: buildTarget(),
      status,
      created_by: userId,
    };

    /*
     * =======================================================
     * CREATE ADMIN ACTION REQUEST
     * =======================================================
     */

    const {
      data: createdRequest,
      error: requestError,
    } = await supabase
      .from("admin_action_requests")
      .insert({
        admin_id: userId,
        section: "announcements",
        action,
        target_id: id ?? null,
        payload,
        reason:
          action === "add"
            ? `طلب إضافة إعلان: ${title.trim()}`
            : `طلب تعديل إعلان: ${title.trim()}`,
        status: "pending",
      })
      .select("id")
      .single();

    if (requestError) {
      console.error(
        "Failed to create announcement action request:",
        requestError
      );

      setError(
        "تعذر إرسال الطلب إلى Root Admin. حاول مرة أخرى."
      );

      return false;
    }

    /*
     * =======================================================
     * NOTIFY ROOT ADMINS
     * =======================================================
     *
     * بعد إنشاء طلب الموافقة بنجاح،
     * نبحث عن جميع حسابات Root Admin
     * ونرسل لهم إشعارًا.
     *
     * هذا الجزء يعمل فقط مع Sub Admin،
     * لأن Root Admin لا يصل أصلًا إلى هذه الدالة.
     */

    const {
      data: rootAdmins,
      error: rootAdminsError,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "root_admin");

    if (rootAdminsError) {
      console.error(
        "Failed to load root admins for notification:",
        rootAdminsError
      );
    } else if (
      rootAdmins &&
      rootAdmins.length > 0
    ) {
      const actionLabel =
        action === "add"
          ? "إضافة"
          : "تعديل";

      const notifications =
        rootAdmins.map((rootAdmin) => ({
          user_id: rootAdmin.id,
          title: "طلب موافقة جديد",
          message: `قام ${
            profile?.full_name ||
            "أحد المشرفين"
          } بإرسال طلب ${actionLabel} إعلان "${title.trim()}" للمراجعة.`,
          type: "approval",
          is_read: false,
        }));

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        /*
         * مهم:
         * فشل الإشعار لا يلغي طلب الموافقة.
         *
         * الطلب تم إنشاؤه بالفعل،
         * لذلك نتركه موجودًا حتى يستطيع Root Admin
         * مراجعته من صفحة Approvals.
         */
        console.error(
          "Failed to notify root admins:",
          notificationError
        );
      }
    } else {
      console.warn(
        "No root admin account found. Approval notification was skipped."
      );
    }

    console.log(
      "Announcement action request created:",
      createdRequest?.id
    );

    return true;
  };

  /*
   * =========================================================
   * SAVE
   * =========================================================
   */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!profile?.id) {
      setError(
        "تعذر تحديد حساب المشرف الحالي."
      );

      return;
    }

    if (!title.trim()) {
      setError(
        "من فضلك اكتب عنوان الإعلان."
      );

      return;
    }

    if (!content.trim()) {
      setError(
        "من فضلك اكتب محتوى الإعلان."
      );

      return;
    }

    if (!date) {
      setError(
        "من فضلك اختر تاريخ الإعلان."
      );

      return;
    }

    if (isEditMode && !canEdit) {
      setError(
        "لا تملك صلاحية تعديل الإعلانات."
      );

      return;
    }

    if (!isEditMode && !canAdd) {
      setError(
        "لا تملك صلاحية إضافة الإعلانات."
      );

      return;
    }

    /*
     * لو تم اختيار برنامج غير صالح
     * بعد تحميل البرامج، نمنع الحفظ.
     */

    if (
      target !== "جميع الطلاب" &&
      programs.length > 0
    ) {
      const selectedProgramExists =
        programs.some(
          (program) =>
            program.name === target
        );

      /*
       * نسمح بالقيمة القديمة أثناء Edit.
       */

      if (
        !selectedProgramExists &&
        !isEditMode
      ) {
        setError(
          "البرنامج المحدد غير موجود في قائمة البرامج."
        );

        return;
      }
    }

    setSaving(true);
    setError("");

    /*
     * =======================================================
     * ROOT ADMIN
     * تنفيذ مباشر
     * =======================================================
     */

    if (isRootAdmin) {
      const payload = {
        title: title.trim(),
        category,
        content: content.trim(),
        date,
        target: buildTarget(),
        status,
        created_by: profile.id,
      };

      /*
       * =====================================================
       * EDIT
       * =====================================================
       */

      if (isEditMode && id) {
        const {
          error: updateError,
        } = await supabase
          .from("announcements")
          .update({
            title: payload.title,
            category: payload.category,
            content: payload.content,
            date: payload.date,
            target: payload.target,
            status: payload.status,
          })
          .eq("id", id);

        if (updateError) {
          console.error(
            "Failed to update announcement:",
            updateError
          );

          setError(
            "تعذر حفظ تعديلات الإعلان. حاول مرة أخرى."
          );

          setSaving(false);

          return;
        }

        /*
         * لا ننشئ Notifications جديدة عند التعديل
         * حتى لا يحصل الطالب على إشعار مكرر.
         */

        navigate("/admin/announcements");

        return;
      }

      /*
       * =====================================================
       * CREATE
       * =====================================================
       */

      const {
        data: createdAnnouncement,
        error: insertError,
      } = await supabase
        .from("announcements")
        .insert(payload)
        .select(
          "id, title, content, target, status"
        )
        .single();

      if (insertError) {
        console.error(
          "Failed to create announcement:",
          insertError
        );

        setError(
          "تعذر إضافة الإعلان. حاول مرة أخرى."
        );

        setSaving(false);

        return;
      }

      /*
       * =====================================================
       * CREATE STUDENT NOTIFICATIONS
       * =====================================================
       *
       * فقط إذا كان الإعلان منشورًا.
       */

      if (
        createdAnnouncement.status ===
        "منشور"
      ) {
        try {
          await createNotificationsForAnnouncement(
            createdAnnouncement.title,
            createdAnnouncement.content,
            createdAnnouncement.target
          );
        } catch (notificationError) {
          console.error(
            "Announcement notification error:",
            notificationError
          );

          /*
           * الإعلان تم حفظه بالفعل.
           * لذلك لا نحذفه إذا فشل إنشاء الإشعارات.
           */

          setError(
            "تم نشر الإعلان، لكن حدثت مشكلة أثناء إرسال الإشعارات للطلاب."
          );

          setSaving(false);

          return;
        }
      }

      /*
       * =====================================================
       * SUCCESS
       * =====================================================
       */

      navigate("/admin/announcements");

      return;
    }

    /*
     * =======================================================
     * SUB ADMIN
     * Request فقط
     * =======================================================
     */

    const action = isEditMode
      ? "edit"
      : "add";

    const requestCreated =
      await createActionRequest(
        profile.id,
        action
      );

    if (!requestCreated) {
      setSaving(false);

      return;
    }

    window.alert(
      isEditMode
        ? "تم إرسال طلب تعديل الإعلان إلى Root Admin للمراجعة."
        : "تم إرسال طلب إضافة الإعلان إلى Root Admin للمراجعة."
    );

    navigate("/admin/announcements");
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <section className="admin-form-panel">
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <LoaderCircle
                size={25}
                className="is-spinning"
              />
            </div>

            <h3>
              جارٍ تحميل الإعلان
            </h3>

            <p>
              يتم جلب بيانات الإعلان من قاعدة
              البيانات.
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
      className="admin-page"
      dir="rtl"
    >
      {/* HEADER */}

      <header className="admin-page__header">
        <div>
          <Link
            to="/admin/announcements"
            className="back-link"
          >
            <ArrowRight size={17} />

            <span>
              العودة للإعلانات
            </span>
          </Link>

          <span className="admin-page__kicker">
            إدارة المحتوى
          </span>

          <h1>
            {isEditMode
              ? "تعديل الإعلان"
              : "إضافة إعلان جديد"}
          </h1>

          <p>
            {isEditMode
              ? isRootAdmin
                ? "قم بتعديل بيانات الإعلان ثم احفظ التغييرات."
                : "قم بتعديل بيانات الإعلان ثم أرسل طلب التعديل إلى Root Admin."
              : isRootAdmin
              ? "أضف إعلانًا جديدًا ليظهر للطلاب على المنصة."
              : "أضف بيانات الإعلان لإرسال طلب الإضافة إلى Root Admin."}
          </p>
        </div>
      </header>

      {/* ERROR */}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <ShieldCheck size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* FORM */}

      <form
        className="admin-form-panel"
        onSubmit={handleSubmit}
      >
        <div className="admin-form-panel__intro">
          <div className="admin-form-panel__icon">
            <Megaphone size={22} />
          </div>

          <div>
            <h2>
              بيانات الإعلان
            </h2>

            <p>
              اكتب المعلومات الأساسية التي سيظهر
              بها الإعلان.
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* TITLE */}

          <label className="admin-form-field admin-form-field--full">
            <span>
              عنوان الإعلان
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="مثال: بدء تسجيل المقررات الدراسية"
              required
              maxLength={180}
            />
          </label>

          {/* CATEGORY */}

          <label className="admin-form-field">
            <span>
              التصنيف
            </span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
            >
              <option value="أكاديمي">
                أكاديمي
              </option>

              <option value="الحياة الطلابية">
                الحياة الطلابية
              </option>

              <option value="مهم">
                مهم
              </option>

              <option value="أنشطة">
                أنشطة
              </option>
            </select>
          </label>

          {/* TARGET */}

          <label className="admin-form-field">
            <span>
              الفئة المستهدفة
            </span>

            <select
              value={target}
              onChange={(event) =>
                setTarget(
                  event.target.value
                )
              }
              disabled={programsLoading}
            >
              <option value="جميع الطلاب">
                جميع الطلاب
              </option>

              {programs.map((program) => (
                <option
                  key={program.id}
                  value={program.name}
                >
                  {program.name}
                </option>
              ))}

              {isEditMode &&
                target !== "جميع الطلاب" &&
                !programs.some(
                  (program) =>
                    program.name === target
                ) && (
                  <option value={target}>
                    {target}
                  </option>
                )}
            </select>

            <small>
              {programsLoading
                ? "جارٍ تحميل البرامج..."
                : "اختر جميع الطلاب أو برنامجًا محددًا."}
            </small>
          </label>

          {/* DATE */}

          <label className="admin-form-field">
            <span>
              تاريخ الإعلان
            </span>

            <div className="admin-input-with-icon">
              <CalendarDays size={17} />

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                required
              />
            </div>
          </label>

          {/* STATUS */}

          <label className="admin-form-field">
            <span>
              الحالة
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as AnnouncementStatus
                )
              }
            >
              <option value="منشور">
                منشور
              </option>

              <option value="مسودة">
                مسودة
              </option>
            </select>

            <small>
              المسودة يتم حفظها بدون إرسال إشعارات للطلاب.
            </small>
          </label>

          {/* CONTENT */}

          <label className="admin-form-field admin-form-field--full">
            <span>
              محتوى الإعلان
            </span>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              placeholder="اكتب تفاصيل الإعلان هنا..."
              rows={9}
              required
              maxLength={10000}
            />

            <small>
              {content.length.toLocaleString(
                "ar-EG"
              )}{" "}
              / 10,000
            </small>
          </label>
        </div>

        {/* ACTIONS */}

        <div className="admin-form-panel__actions">
          <Link
            to="/admin/announcements"
            className="admin-secondary-button"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={
              saving ||
              programsLoading
            }
          >
            {saving ? (
              <LoaderCircle
                size={18}
                className="is-spinning"
              />
            ) : (
              <Save size={18} />
            )}

            <span>
              {saving
                ? "جارٍ الإرسال..."
                : isRootAdmin
                ? isEditMode
                  ? "حفظ التعديلات"
                  : "إضافة الإعلان"
                : isEditMode
                ? "إرسال طلب التعديل"
                : "إرسال طلب الإضافة"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}