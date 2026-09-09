import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MessageCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { requests } from "../../data/requests";

const statusIcons = {
  "قيد الانتظار": Clock3,
  "قيد المراجعة": Clock3,
  "تم الحل": CheckCircle2,
};

const statusColors = {
  "قيد الانتظار": "warning",
  "قيد المراجعة": "info",
  "تم الحل": "success",
};

const statusSteps = [
  {
    key: "submitted",
    title: "تم إرسال الطلب",
    description: "تم استلام طلبك بنجاح.",
  },
  {
    key: "reviewing",
    title: "قيد المراجعة",
    description:
      "يتم الآن مراجعة الطلب من الفريق المختص.",
  },
  {
    key: "resolved",
    title: "تم الحل",
    description:
      "تم الانتهاء من معالجة الطلب.",
  },
];

export default function RequestDetails() {
  const { id } = useParams();

  const request = requests.find(
    (item) => item.id === id
  );

  if (!request) {
    return (
      <main className="page-shell request-details-page" dir="rtl">
        <div className="empty-state request-not-found">
          <div className="request-not-found__icon">
            <ClipboardList size={30} />
          </div>

          <h1>الطلب غير موجود</h1>

          <p>
            لم نتمكن من العثور على الطلب الذي تبحث عنه.
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

  const StatusIcon = statusIcons[request.status];
  const statusColor = statusColors[request.status];

  const currentStep =
    request.status === "تم الحل"
      ? 3
      : request.status === "قيد المراجعة"
        ? 2
        : 1;

  return (
    <main
      className="page-shell request-details-page"
      dir="rtl"
    >
      <Link to="/requests" className="back-link">
        <ArrowRight size={17} />
        العودة إلى طلباتي
      </Link>

      <section className="request-details-card">
        {/* Header */}
        <div className="request-details__header">
          <div className="request-details__icon">
            <ClipboardList size={25} />
          </div>

          <span
            className={`status-badge status-badge--${statusColor}`}
          >
            <StatusIcon size={15} />
            {request.status}
          </span>
        </div>

        <span className="request-details__id">
          {request.id}
        </span>

        <h1>{request.title}</h1>

        <span className="request-details__category">
          {request.category}
        </span>

        {/* Information */}
        <div className="request-details__info">
          <div>
            <Clock3 size={17} />

            <span>تاريخ الإرسال</span>

            <strong>{request.createdAt}</strong>
          </div>

          <div>
            <FileText size={17} />

            <span>نوع الطلب</span>

            <strong>{request.category}</strong>
          </div>

          <div>
            <MessageCircle size={17} />

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
              المرحلة {currentStep} من {statusSteps.length}
            </small>
          </div>

          <div className="timeline">
            {statusSteps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive =
                stepNumber <= currentStep;

              return (
                <div
                  className={`timeline-item ${
                    isActive
                      ? "timeline-item--active"
                      : ""
                  }`}
                  key={step.key}
                >
                  <div className="timeline-item__marker">
                    {isActive ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span>{stepNumber}</span>
                    )}
                  </div>

                  <div className="timeline-item__content">
                    <strong>{step.title}</strong>

                    <span>{step.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}