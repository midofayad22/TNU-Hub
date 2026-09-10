import {
  ArrowRight,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Save,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

interface EventTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
}

type EventStatus = "قادمة" | "منتهية" | "مسودة";

export default function AdminEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ورشة عمل");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("جميع الطلاب");
  const [status, setStatus] =
    useState<EventStatus>("قادمة");

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pageTitle = useMemo(
    () =>
      isEditMode
        ? "تعديل الفعالية"
        : "إضافة فعالية جديدة",
    [isEditMode]
  );

  const getTargetObject = (
    selectedTarget: string
  ): EventTarget => {
    if (selectedTarget === "هندسة الحاسبات") {
      return {
        faculty: "هندسة الحاسبات",
      };
    }

    if (selectedTarget === "الفرقة الأولى") {
      return {
        academicYear: "الفرقة الأولى",
      };
    }

    return {};
  };

  const getTargetValue = (
    eventTarget: EventTarget | null | undefined
  ) => {
    if (!eventTarget) {
      return "جميع الطلاب";
    }

    if (eventTarget.faculty) {
      return eventTarget.faculty;
    }

    if (eventTarget.program) {
      return eventTarget.program;
    }

    if (eventTarget.academicYear) {
      return eventTarget.academicYear;
    }

    return "جميع الطلاب";
  };

  useEffect(() => {
    if (!isEditMode || !id) {
      return;
    }

    const loadEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error: fetchError } = await supabase
          .from("events")
          .select(
            `
              id,
              title,
              category,
              description,
              date,
              time,
              location,
              capacity,
              target,
              status
            `
          )
          .eq("id", id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error("Event not found");
        }

        setTitle(data.title ?? "");
        setCategory(data.category ?? "ورشة عمل");
        setDate(data.date ?? "");
        setTime(data.time?.slice(0, 5) ?? "");
        setLocation(data.location ?? "");
        setCapacity(
          data.capacity !== null &&
          data.capacity !== undefined
            ? String(data.capacity)
            : ""
        );
        setDescription(data.description ?? "");
        setStatus(
          (data.status as EventStatus) ?? "قادمة"
        );

        setTarget(
          getTargetValue(
            data.target as EventTarget | null
          )
        );
      } catch (err) {
        console.error("Error loading event:", err);

        setError(
          "تعذر تحميل بيانات الفعالية. قد تكون الفعالية غير موجودة أو حدث خطأ في الاتصال."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadEvent();
  }, [id, isEditMode]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    const trimmedTitle = title.trim();
    const trimmedLocation = location.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError("من فضلك اكتب اسم الفعالية.");
      return;
    }

    if (!date) {
      setError("من فضلك اختر تاريخ الفعالية.");
      return;
    }

    if (!time) {
      setError("من فضلك اختر وقت الفعالية.");
      return;
    }

    if (!trimmedLocation) {
      setError("من فضلك اكتب مكان الفعالية.");
      return;
    }

    if (!trimmedDescription) {
      setError("من فضلك اكتب وصف الفعالية.");
      return;
    }

    const numericCapacity =
      capacity.trim() === ""
        ? null
        : Number(capacity);

    if (
      numericCapacity !== null &&
      (!Number.isInteger(numericCapacity) ||
        numericCapacity <= 0)
    ) {
      setError(
        "عدد المقاعد يجب أن يكون رقمًا صحيحًا أكبر من صفر."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "يجب تسجيل الدخول بحساب إداري لإتمام العملية."
        );
        return;
      }

      const eventData = {
        title: trimmedTitle,
        category,
        description: trimmedDescription,
        date,
        time,
        location: trimmedLocation,
        capacity: numericCapacity,
        target: getTargetObject(target),
        status,
      };

      if (isEditMode && id) {
        const { error: updateError } = await supabase
          .from("events")
          .update({
            ...eventData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("events")
          .insert({
            ...eventData,
            created_by: user.id,
          });

        if (insertError) {
          throw insertError;
        }
      }

      navigate("/admin/events");
    } catch (err) {
      console.error("Error saving event:", err);

      setError(
        isEditMode
          ? "تعذر حفظ تعديلات الفعالية. حاول مرة أخرى."
          : "تعذر إضافة الفعالية. حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page" dir="rtl">
        <div className="admin-empty-state">
          <div className="admin-empty-state__icon">
            <LoaderCircle
              size={25}
              className="admin-spin"
            />
          </div>

          <h3>جاري تحميل الفعالية</h3>

          <p>
            يتم الآن جلب بيانات الفعالية من قاعدة البيانات.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" dir="rtl">
      {/* Header */}
      <header className="admin-page__header">
        <div>
          <Link
            to="/admin/events"
            className="back-link"
          >
            <ArrowRight size={17} />
            <span>العودة للفعاليات</span>
          </Link>

          <span className="admin-page__kicker">
            إدارة المحتوى
          </span>

          <h1>{pageTitle}</h1>

          <p>
            {isEditMode
              ? "قم بتعديل بيانات الفعالية ثم احفظ التغييرات."
              : "أضف فعالية جديدة ليتم عرضها للطلاب."}
          </p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        className="admin-form-panel"
        onSubmit={handleSubmit}
      >
        <div className="admin-form-panel__intro">
          <div className="admin-form-panel__icon">
            <CalendarDays size={22} />
          </div>

          <div>
            <h2>بيانات الفعالية</h2>

            <p>
              أدخل المعلومات الأساسية الخاصة بالفعالية.
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* Title */}
          <label className="admin-form-field admin-form-field--full">
            <span>اسم الفعالية</span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="مثال: ورشة تطوير مهارات البرمجة"
              autoComplete="off"
              required
            />
          </label>

          {/* Category */}
          <label className="admin-form-field">
            <span>نوع الفعالية</span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="ورشة عمل">
                ورشة عمل
              </option>

              <option value="مسابقة">
                مسابقة
              </option>

              <option value="اجتماعي">
                اجتماعي
              </option>

              <option value="أكاديمي">
                أكاديمي
              </option>
            </select>
          </label>

          {/* Date */}
          <label className="admin-form-field">
            <span>التاريخ</span>

            <div className="admin-input-with-icon">
              <CalendarDays size={17} />

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                required
              />
            </div>
          </label>

          {/* Time */}
          <label className="admin-form-field">
            <span>الوقت</span>

            <div className="admin-input-with-icon">
              <Clock3 size={17} />

              <input
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
                required
              />
            </div>
          </label>

          {/* Capacity */}
          <label className="admin-form-field">
            <span>عدد المقاعد</span>

            <div className="admin-input-with-icon">
              <Users size={17} />

              <input
                type="number"
                min="1"
                step="1"
                value={capacity}
                onChange={(event) =>
                  setCapacity(event.target.value)
                }
                placeholder="80"
                inputMode="numeric"
              />
            </div>

            <small>
              اتركه فارغًا إذا كانت السعة غير محددة.
            </small>
          </label>

          {/* Location */}
          <label className="admin-form-field admin-form-field--full">
            <span>المكان</span>

            <div className="admin-input-with-icon">
              <MapPin size={17} />

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="مثال: مبنى هندسة الحاسبات"
                autoComplete="off"
                required
              />
            </div>
          </label>

          {/* Target */}
          <label className="admin-form-field">
            <span>الفئة المستهدفة</span>

            <select
              value={target}
              onChange={(event) =>
                setTarget(event.target.value)
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

          {/* Status */}
          <label className="admin-form-field">
            <span>الحالة</span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as EventStatus
                )
              }
            >
              <option value="قادمة">
                قادمة
              </option>

              <option value="مسودة">
                مسودة
              </option>

              <option value="منتهية">
                منتهية
              </option>
            </select>
          </label>

          {/* Description */}
          <label className="admin-form-field admin-form-field--full">
            <span>وصف الفعالية</span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="اكتب تفاصيل الفعالية هنا..."
              rows={8}
              required
            />
          </label>
        </div>

        {/* Actions */}
        <div className="admin-form-panel__actions">
          <Link
            to="/admin/events"
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
                className="admin-spin"
              />
            ) : (
              <Save size={18} />
            )}

            <span>
              {saving
                ? "جاري الحفظ..."
                : isEditMode
                ? "حفظ التعديلات"
                : "إضافة الفعالية"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}