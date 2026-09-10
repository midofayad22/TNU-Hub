import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MessageCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import { supabase } from "../../lib/supabase";

type RequestStatus =
  | "قيد الانتظار"
  | "قيد المراجعة"
  | "تم الحل";

interface RequestItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: RequestStatus;
  created_at: string;
}

const statusIcons = {
  "قيد الانتظار": Clock3,
  "قيد المراجعة": Clock3,
  "تم الحل": CheckCircle2,
} as const;

const statusColors = {
  "قيد الانتظار": "warning",
  "قيد المراجعة": "info",
  "تم الحل": "success",
} as const;

const statusSteps = [
  {
    key: "submitted",
    title: "تم إرسال الطلب",
    description: "تم استلام طلبك بنجاح.",
  },
  {
    key: "reviewing",
    title: "قيد المراجعة",
    description: "يتم الآن مراجعة الطلب من الفريق المختص.",
  },
  {
    key: "resolved",
    title: "تم الحل",
    description: "تم الانتهاء من معالجة الطلب.",
  },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] =
    useState<RequestItem | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!id) {
          setRequest(null);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRequest(null);
          setError(
            "يجب تسجيل الدخول لعرض تفاصيل الطلب."
          );
          return;
        }

        const { data, error: requestError } =
          await supabase
            .from("requests")
            .select(
              "id, title, category, description, status, created_at"
            )
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (requestError) {
          console.error(
            "Failed to load request:",
            requestError
          );

          setError(
            "حدث خطأ أثناء تحميل تفاصيل الطلب."
          );

          return;
        }

        setRequest(data as RequestItem | null);
      } catch (error) {
        console.error(
          "Failed to load request details:",
          error
        );

        setError(
          "حدث خطأ غير متوقع أثناء تحميل الطلب."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadRequest();
  }, [id]);

  const handleDelete = async () => {
    if (!request || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذا الطلب؟\n\nلا يمكن التراجع عن هذا الإجراء."
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "يجب تسجيل الدخول لحذف الطلب."
        );

        return;
      }

      const { error: deleteError } =
        await supabase
          .from("requests")
          .delete()
          .eq("id", request.id)
          .eq("user_id", user.id);

      if (deleteError) {
        console.error(
          "Failed to delete request:",
          deleteError
        );

        setError(
          "تعذر حذف الطلب. حاول مرة أخرى."
        );

        return;
      }

      navigate("/requests");
    } catch (error) {
      console.error(
        "Failed to delete request:",
        error
      );

      setError(
        "حدث خطأ غير متوقع أثناء حذف الطلب."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main
        className="page-shell request-details-page"
        dir="rtl"
      >
        <div className="details-not-found request-not-found">
          <div className="details-not-found__icon">
            <Clock3
              size={30}
              aria-hidden="true"
            />
          </div>

          <span>الطلبات</span>

          <h1>جاري تحميل الطلب</h1>

          <p>
            انتظر قليلًا حتى يتم تحميل تفاصيل طلبك.
          </p>
        </div>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main
        className="page-shell request-details-page"
        dir="rtl"
      >
        <div className="details-not-found request-not-found">
          <div className="details-not-found__icon">
            <ClipboardList
              size={30}
              aria-hidden="true"
            />
          </div>

          <span>الطلبات</span>

          <h1>
            {error
              ? "تعذر تحميل الطلب"
              : "الطلب غير موجود"}
          </h1>

          <p>
            {error ??
              "لم نتمكن من العثور على الطلب الذي تبحث عنه."}
          </p>

          <Link
            to="/requests"
            className="button button--primary"
          >
            العودة إلى طلباتي
          </Link>
        </div>
      </main>
    );
  }

  const StatusIcon =
    statusIcons[request.status];

  const statusColor =
    statusColors[request.status];

  const currentStep =
    request.status === "تم الحل"
      ? 3
      : request.status === "قيد المراجعة"
        ? 2
        : 1;

  const progressPercentage =
    ((currentStep - 1) /
      (statusSteps.length - 1)) *
    100;

  return (
    <main
      className="page-shell request-details-page"
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

      <section className="request-details-card">
        {/* Header */}
        <div className="request-details__header">
          <div className="request-details__header-main">
            <div className="request-details__icon">
              <ClipboardList
                size={25}
                aria-hidden="true"
              />
            </div>

            <div>
              <span className="request-details__eyebrow">
                تفاصيل الطلب
              </span>

              <span className="request-details__id">
                {request.id}
              </span>
            </div>
          </div>

          <span
            className={`status-badge status-badge--${statusColor}`}
          >
            <StatusIcon
              size={15}
              aria-hidden="true"
            />

            {request.status}
          </span>
        </div>

        <div className="request-details__title">
          <h1>{request.title}</h1>

          <span className="request-details__category">
            {request.category}
          </span>
        </div>

        {/* Information */}
        <div className="request-details__info">
          <div className="request-details__info-item">
            <Clock3
              size={17}
              aria-hidden="true"
            />

            <span>تاريخ الإرسال</span>

            <strong>
              {formatDate(request.created_at)}
            </strong>
          </div>

          <div className="request-details__info-item">
            <FileText
              size={17}
              aria-hidden="true"
            />

            <span>نوع الطلب</span>

            <strong>
              {request.category}
            </strong>
          </div>

          <div className="request-details__info-item">
            <MessageCircle
              size={17}
              aria-hidden="true"
            />

            <span>رقم الطلب</span>

            <strong>{request.id}</strong>
          </div>
        </div>

        {/* Description */}
        <div className="request-details__body">
          <span>تفاصيل الطلب</span>

          <h2>وصف المشكلة أو الاستفسار</h2>

          <p>{request.description}</p>
        </div>

        {/* Timeline */}
        <div className="request-timeline">
          <div className="request-timeline__heading">
            <div>
              <span>المتابعة</span>

              <h2>حالة الطلب</h2>
            </div>

            <small>
              المرحلة {currentStep} من{" "}
              {statusSteps.length}
            </small>
          </div>

          <div
            className="timeline"
            style={
              {
                "--timeline-progress": `${progressPercentage}%`,
              } as CSSProperties
            }
          >
            {statusSteps.map(
              (step, index) => {
                const stepNumber = index + 1;

                const isActive =
                  stepNumber <= currentStep;

                const isCurrent =
                  stepNumber === currentStep;

                return (
                  <div
                    className={`timeline-item ${
                      isActive
                        ? "timeline-item--active"
                        : ""
                    } ${
                      isCurrent
                        ? "timeline-item--current"
                        : ""
                    }`}
                    key={step.key}
                  >
                    <div className="timeline-item__marker">
                      {isActive ? (
                        <CheckCircle2
                          size={16}
                          aria-hidden="true"
                        />
                      ) : (
                        <span>
                          {stepNumber}
                        </span>
                      )}
                    </div>

                    <div className="timeline-item__content">
                      <strong>
                        {step.title}
                      </strong>

                      <span>
                        {step.description}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Delete */}
        <div className="request-details__actions">
          <button
            type="button"
            className="button button--danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2
                  size={17}
                  className="spin"
                  aria-hidden="true"
                />
                جاري حذف الطلب...
              </>
            ) : (
              <>
                <Trash2
                  size={17}
                  aria-hidden="true"
                />
                حذف الطلب
              </>
            )}
          </button>
        </div>

        {error && (
          <p
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </section>
    </main>
  );
}