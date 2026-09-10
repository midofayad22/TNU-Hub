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
  type: "all" | "faculty" | "year";
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

export default function AdminAnnouncementForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { profile } = useAuth();

  const isEditMode = Boolean(id);
  const isRootAdmin = profile?.role === "root_admin";

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState("أكاديمي");
  const [target, setTarget] =
    useState("جميع الطلاب");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] =
    useState<AnnouncementStatus>("منشور");

  const [loading, setLoading] =
    useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

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
      const { data, error: permissionError } =
        await supabase
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

      const { data, error: fetchError } =
        await supabase
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

      if (!announcement.target) {
        setTarget("جميع الطلاب");
      } else if (
        announcement.target.type === "faculty"
      ) {
        setTarget(
          announcement.target.value ||
            "هندسة الحاسبات"
        );
      } else if (
        announcement.target.type === "year"
      ) {
        setTarget(
          announcement.target.value ||
            "الفرقة الأولى"
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

    if (target === "هندسة الحاسبات") {
      return {
        type: "faculty",
        value: "هندسة الحاسبات",
      };
    }

    if (target === "الفرقة الأولى") {
      return {
        type: "year",
        value: "الفرقة الأولى",
      };
    }

    return {
      type: "all",
    };
  };

  /*
   * =========================================================
   * CREATE REQUEST
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

    const { error: requestError } =
      await supabase
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
        });

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
       * EDIT
       */

      if (isEditMode && id) {
        const { error: updateError } =
          await supabase
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
      }

      /*
       * CREATE
       */

      else {
        const { error: insertError } =
          await supabase
            .from("announcements")
            .insert(payload);

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
      }

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
      <div className="admin-page" dir="rtl">
        <section className="admin-form-panel">
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <LoaderCircle
                size={25}
                className="is-spinning"
              />
            </div>

            <h3>جارٍ تحميل الإعلان</h3>

            <p>
              يتم جلب بيانات الإعلان من قاعدة البيانات.
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
    <div className="admin-page" dir="rtl">
      {/* =====================================================
          HEADER
      ====================================================== */}

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

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <ShieldCheck size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          FORM
      ====================================================== */}

      <form
        className="admin-form-panel"
        onSubmit={handleSubmit}
      >
        <div className="admin-form-panel__intro">
          <div className="admin-form-panel__icon">
            <Megaphone size={22} />
          </div>

          <div>
            <h2>بيانات الإعلان</h2>

            <p>
              اكتب المعلومات الأساسية التي سيظهر بها
              الإعلان.
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* TITLE */}

          <label className="admin-form-field admin-form-field--full">
            <span>عنوان الإعلان</span>

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
            <span>التصنيف</span>

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
            <span>الفئة المستهدفة</span>

            <select
              value={target}
              onChange={(event) =>
                setTarget(
                  event.target.value
                )
              }
            >
              <option value="جميع الطلاب">
                جميع الطلاب
              </option>

              <option value="هندسة الحاسبات">
                هندسة الحاسبات
              </option>

              <option value="الفرقة الأولى">
                الفرقة الأولى
              </option>
            </select>
          </label>

          {/* DATE */}

          <label className="admin-form-field">
            <span>تاريخ الإعلان</span>

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
            <span>الحالة</span>

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
          </label>

          {/* CONTENT */}

          <label className="admin-form-field admin-form-field--full">
            <span>محتوى الإعلان</span>

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
            disabled={saving}
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