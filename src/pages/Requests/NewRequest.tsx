import {
  ArrowRight,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

const categories = [
  {
    value: "academic",
    label: "الدعم الأكاديمي",
  },
  {
    value: "technical",
    label: "الدعم التقني",
  },
  {
    value: "student-services",
    label: "الخدمات الطلابية",
  },
  {
    value: "activities",
    label: "الأنشطة الطلابية",
  },
  {
    value: "complaints",
    label: "شكوى",
  },
  {
    value: "suggestions",
    label: "مقترح",
  },
];

const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 1000;

type FormErrors = {
  title?: string;
  category?: string;
  description?: string;
};

export default function NewRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCategory =
    searchParams.get("category") ?? "";

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState(initialCategory);
  const [description, setDescription] =
    useState("");

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const validate = () => {
    const nextErrors: FormErrors = {};

    const trimmedTitle = title.trim();
    const trimmedDescription =
      description.trim();

    if (!trimmedTitle) {
      nextErrors.title =
        "اكتب عنوانًا للطلب.";
    } else if (trimmedTitle.length < 5) {
      nextErrors.title =
        "عنوان الطلب يجب أن يكون 5 أحرف على الأقل.";
    }

    if (!category) {
      nextErrors.category =
        "اختر نوع الطلب.";
    }

    if (!trimmedDescription) {
      nextErrors.description =
        "اكتب تفاصيل المشكلة أو الاستفسار.";
    } else if (
      trimmedDescription.length <
      MIN_DESCRIPTION_LENGTH
    ) {
      nextErrors.description = `اكتب تفاصيل أكثر، الحد الأدنى ${MIN_DESCRIPTION_LENGTH} حرفًا.`;
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitted(true);

    window.setTimeout(() => {
      navigate("/requests");
    }, 1400);
  };

  const updateTitle = (value: string) => {
    setTitle(value);

    if (errors.title) {
      setErrors((current) => ({
        ...current,
        title: undefined,
      }));
    }
  };

  const updateCategory = (value: string) => {
    setCategory(value);

    if (errors.category) {
      setErrors((current) => ({
        ...current,
        category: undefined,
      }));
    }
  };

  const updateDescription = (
    value: string,
  ) => {
    setDescription(value);

    if (errors.description) {
      setErrors((current) => ({
        ...current,
        description: undefined,
      }));
    }
  };

  if (isSubmitted) {
    return (
      <main
        className="page-shell new-request-page"
        dir="rtl"
      >
        <div className="request-success">
          <div className="request-success__icon">
            <CheckCircle2
              size={34}
              aria-hidden="true"
            />
          </div>

          <span>تم بنجاح</span>

          <h1>تم إرسال طلبك</h1>

          <p>
            تم استلام طلبك بنجاح، وسيتم توجيهه إلى
            الفريق المختص لمراجعته.
          </p>

          <small>
            سيتم نقلك إلى صفحة طلباتك...
          </small>
        </div>
      </main>
    );
  }

  return (
    <main
      className="page-shell new-request-page"
      dir="rtl"
    >
      <Link
        to="/requests"
        className="back-link"
      >
        <ArrowRight
          size={17}
          aria-hidden="true"
        />
        العودة إلى طلباتي
      </Link>

      <section className="form-header new-request-header">
        <span className="page-kicker">
          طلب جديد
        </span>

        <div className="new-request-header__title">
          <div className="new-request-header__icon">
            <Send
              size={21}
              aria-hidden="true"
            />
          </div>

          <h1>إرسال طلب</h1>
        </div>

        <p>
          اشرح مشكلتك أو استفسارك بوضوح حتى نتمكن
          من مساعدتك بشكل أفضل.
        </p>
      </section>

      <form
        className="request-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="request-form__intro">
          <strong>أخبرنا بما تحتاج إليه</strong>
          <span>
            املأ البيانات التالية وسنوجّه طلبك
            إلى الجهة المختصة.
          </span>
        </div>

        {/* Title */}
        <div className="form-field">
          <label htmlFor="request-title">
            عنوان الطلب
          </label>

          <input
            id="request-title"
            type="text"
            value={title}
            onChange={(event) =>
              updateTitle(event.target.value)
            }
            placeholder="مثال: مشكلة في تسجيل المقرر"
            className={
              errors.title
                ? "form-input--error"
                : ""
            }
            aria-invalid={Boolean(errors.title)}
            aria-describedby={
              errors.title
                ? "request-title-error"
                : undefined
            }
            autoComplete="off"
          />

          {errors.title && (
            <span
              id="request-title-error"
              className="form-error"
              role="alert"
            >
              {errors.title}
            </span>
          )}
        </div>

        {/* Category */}
        <div className="form-field">
          <label htmlFor="request-category">
            نوع الطلب
          </label>

          <select
            id="request-category"
            value={category}
            onChange={(event) =>
              updateCategory(
                event.target.value,
              )
            }
            className={
              errors.category
                ? "form-input--error"
                : ""
            }
            aria-invalid={Boolean(
              errors.category,
            )}
            aria-describedby={
              errors.category
                ? "request-category-error"
                : undefined
            }
          >
            <option value="">
              اختر نوع الطلب
            </option>

            {categories.map((item) => (
              <option
                value={item.value}
                key={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>

          {errors.category && (
            <span
              id="request-category-error"
              className="form-error"
              role="alert"
            >
              {errors.category}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="form-field">
          <div className="form-label-row">
            <label htmlFor="request-description">
              تفاصيل الطلب
            </label>

            <span
              className={
                description.length >
                MAX_DESCRIPTION_LENGTH * 0.9
                  ? "form-character-count form-character-count--warning"
                  : "form-character-count"
              }
            >
              {description.length}/
              {MAX_DESCRIPTION_LENGTH}
            </span>
          </div>

          <textarea
            id="request-description"
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            onChange={(event) =>
              updateDescription(
                event.target.value,
              )
            }
            placeholder="اكتب تفاصيل المشكلة أو الاستفسار هنا..."
            rows={8}
            className={
              errors.description
                ? "form-input--error"
                : ""
            }
            aria-invalid={Boolean(
              errors.description,
            )}
            aria-describedby="request-description-help"
          />

          <div
            className="form-field-footer"
            id="request-description-help"
          >
            {errors.description ? (
              <span
                className="form-error"
                role="alert"
              >
                {errors.description}
              </span>
            ) : (
              <span>
                حاول تقديم أكبر قدر ممكن من
                التفاصيل.
              </span>
            )}

            <span>
              الحد الأدنى{" "}
              {MIN_DESCRIPTION_LENGTH} حرفًا
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="request-form__footer">
          <Link
            to="/requests"
            className="button button--secondary"
          >
            إلغاء
          </Link>

          <button
            className="button button--primary request-submit"
            type="submit"
          >
            <Send
              size={17}
              aria-hidden="true"
            />
            إرسال الطلب
          </button>
        </div>
      </form>
    </main>
  );
}