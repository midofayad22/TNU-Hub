import {
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { requests } from "../../data/requests";

const statuses = [
  "الكل",
  "قيد الانتظار",
  "قيد المراجعة",
  "تم الحل",
];

const categories = [
  "الكل",
  ...new Set(requests.map((request) => request.category)),
];

export default function Requests() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("الكل");
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        request.id.toLowerCase().includes(query) ||
        request.title.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        request.category.toLowerCase().includes(query);

      const matchesStatus =
        activeStatus === "الكل" ||
        request.status === activeStatus;

      const matchesCategory =
        activeCategory === "الكل" ||
        request.category === activeCategory;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [search, activeStatus, activeCategory]);

  const pendingCount = requests.filter(
    (item) => item.status === "قيد الانتظار"
  ).length;

  const reviewingCount = requests.filter(
    (item) => item.status === "قيد المراجعة"
  ).length;

  const solvedCount = requests.filter(
    (item) => item.status === "تم الحل"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setActiveStatus("الكل");
    setActiveCategory("الكل");
  };

  const hasFilters =
    search ||
    activeStatus !== "الكل" ||
    activeCategory !== "الكل";

  return (
    <main className="page-shell requests-page" dir="rtl">
      {/* Header */}
      <section className="requests-header">
        <div>
          <span className="page-kicker">المتابعة</span>

          <h1>طلباتي</h1>

          <p>
            تابع جميع الطلبات والاستفسارات التي أرسلتها
            وتعرّف على آخر تحديث لحالتها.
          </p>
        </div>

        <Link
          to="/requests/new"
          className="requests-new-button"
        >
          <Plus size={18} />
          طلب جديد
        </Link>
      </section>

      {/* Stats */}
      <section className="requests-stats">
        <div className="request-stat">
          <div className="request-stat__icon">
            <FileText size={20} />
          </div>

          <div>
            <strong>{requests.length}</strong>
            <span>إجمالي الطلبات</span>
          </div>
        </div>

        <div className="request-stat">
          <div className="request-stat__icon request-stat__icon--warning">
            <Clock3 size={20} />
          </div>

          <div>
            <strong>{pendingCount}</strong>
            <span>قيد الانتظار</span>
          </div>
        </div>

        <div className="request-stat">
          <div className="request-stat__icon request-stat__icon--info">
            <Clock3 size={20} />
          </div>

          <div>
            <strong>{reviewingCount}</strong>
            <span>قيد المراجعة</span>
          </div>
        </div>

        <div className="request-stat">
          <div className="request-stat__icon request-stat__icon--success">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <strong>{solvedCount}</strong>
            <span>تم الحل</span>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="requests-toolbar">
        <div className="requests-search">
          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث برقم الطلب أو العنوان أو النوع..."
            aria-label="البحث في الطلبات"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="requests-search__clear"
              aria-label="مسح البحث"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <span className="requests-result-count">
          {filteredRequests.length} طلب
        </span>
      </section>

      {/* Status Filters */}
      <section className="requests-filter-row">
        <div className="requests-filter-group">
          <span className="requests-filter-label">
            الحالة
          </span>

          <div className="requests-filter-list">
            {statuses.map((status) => {
              const isActive = activeStatus === status;

              return (
                <button
                  type="button"
                  key={status}
                  className={`requests-filter ${
                    isActive
                      ? "requests-filter--active"
                      : ""
                  }`}
                  onClick={() => setActiveStatus(status)}
                  aria-pressed={isActive}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        <div className="requests-filter-group">
          <span className="requests-filter-label">
            <Filter size={14} />
            النوع
          </span>

          <div className="requests-filter-list">
            {categories.map((category) => {
              const isActive =
                activeCategory === category;

              return (
                <button
                  type="button"
                  key={category}
                  className={`requests-filter ${
                    isActive
                      ? "requests-filter--active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveCategory(category)
                  }
                  aria-pressed={isActive}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* List */}
      <section className="requests-content">
        <div className="requests-section-heading">
          <div>
            <span>سجل الطلبات</span>

            <h2>
              {hasFilters
                ? "نتائج البحث والتصفية"
                : "جميع طلباتك"}
            </h2>
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="request-list">
            {filteredRequests.map((request, index) => (
              <Link
                to={`/requests/${request.id}`}
                className="request-card"
                key={request.id}
                style={
                  {
                    "--request-index": index,
                  } as React.CSSProperties
                }
              >
                <div className="request-card__top">
                  <span className="request-id">
                    {request.id}
                  </span>

                  <span
                    className={`status-badge status-badge--${request.status}`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="request-card__body">
                  <h2>{request.title}</h2>

                  <span className="request-category">
                    {request.category}
                  </span>

                  <p>{request.description}</p>
                </div>

                <div className="request-card__bottom">
                  <span>{request.createdAt}</span>

                  <span>
                    عرض التفاصيل
                    <span aria-hidden="true">←</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="requests-empty">
            <div className="requests-empty__icon">
              <Search size={25} />
            </div>

            <h3>لم نجد أي طلبات مطابقة</h3>

            <p>
              جرّب استخدام كلمة مختلفة أو غيّر الفلاتر
              لعرض المزيد من الطلبات.
            </p>

            <div className="requests-empty__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={clearFilters}
              >
                مسح الفلاتر
              </button>

              <Link
                to="/requests/new"
                className="button button--primary"
              >
                إنشاء طلب جديد
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}