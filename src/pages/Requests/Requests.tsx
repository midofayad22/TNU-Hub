import {
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";

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

const statuses = [
  "الكل",
  "قيد الانتظار",
  "قيد المراجعة",
  "تم الحل",
];

export default function Requests() {
  const [requests, setRequests] = useState<RequestItem[]>(
    [],
  );

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] =
    useState("الكل");
  const [activeCategory, setActiveCategory] =
    useState("الكل");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setRequests([]);
          setError(
            "يجب تسجيل الدخول حتى تتمكن من عرض طلباتك.",
          );
          return;
        }

        const { data, error: requestsError } =
          await supabase
            .from("requests")
            .select(
              "id, title, category, description, status, created_at",
            )
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false,
            });

        if (requestsError) {
          throw requestsError;
        }

        setRequests(
          (data ?? []) as RequestItem[],
        );
      } catch (err) {
        console.error(
          "Failed to load requests:",
          err,
        );

        setError(
          "حدث خطأ أثناء تحميل طلباتك. حاول مرة أخرى.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadRequests();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        requests.map(
          (request) => request.category,
        ),
      ),
    );

    return ["الكل", ...uniqueCategories];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        request.id.toLowerCase().includes(query) ||
        request.title.toLowerCase().includes(query) ||
        request.description
          .toLowerCase()
          .includes(query) ||
        request.category
          .toLowerCase()
          .includes(query);

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
  }, [
    requests,
    search,
    activeStatus,
    activeCategory,
  ]);

  const pendingCount = useMemo(
    () =>
      requests.filter(
        (item) =>
          item.status === "قيد الانتظار",
      ).length,
    [requests],
  );

  const reviewingCount = useMemo(
    () =>
      requests.filter(
        (item) =>
          item.status === "قيد المراجعة",
      ).length,
    [requests],
  );

  const solvedCount = useMemo(
    () =>
      requests.filter(
        (item) => item.status === "تم الحل",
      ).length,
    [requests],
  );

  const clearFilters = () => {
    setSearch("");
    setActiveStatus("الكل");
    setActiveCategory("الكل");
  };

  const hasFilters =
    Boolean(search.trim()) ||
    activeStatus !== "الكل" ||
    activeCategory !== "الكل";

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsedDate);
  };

  return (
    <main
      className="page-shell requests-page"
      dir="rtl"
    >
      {/* Header */}
      <section className="requests-header">
        <div className="requests-header__content">
          <span className="page-kicker">
            المتابعة
          </span>

          <div className="requests-header__title-row">
            <div className="requests-header__icon">
              <FileText
                size={21}
                aria-hidden="true"
              />
            </div>

            <h1>طلباتي</h1>

            <span className="requests-header__count">
              {requests.length} طلب
            </span>
          </div>

          <p>
            تابع جميع الطلبات والاستفسارات التي أرسلتها
            وتعرّف على آخر تحديث لحالتها.
          </p>
        </div>

        <Link
          to="/requests/new"
          className="requests-new-button"
        >
          <Plus
            size={18}
            aria-hidden="true"
          />
          <span>طلب جديد</span>
        </Link>
      </section>

      {/* Stats */}
      <section
        className="requests-stats"
        aria-label="ملخص الطلبات"
      >
        <div className="request-stat">
          <div className="request-stat__icon">
            <FileText
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>{requests.length}</strong>
            <span>إجمالي الطلبات</span>
          </div>
        </div>

        <div className="request-stat">
          <div className="request-stat__icon request-stat__icon--warning">
            <Clock3
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>{pendingCount}</strong>
            <span>قيد الانتظار</span>
          </div>
        </div>

        <div className="request-stat">
          <div className="request-stat__icon request-stat__icon--info">
            <Clock3
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>{reviewingCount}</strong>
            <span>قيد المراجعة</span>
          </div>
        </div>

        <div className="request-stat">
          <div className="request-stat__icon request-stat__icon--success">
            <CheckCircle2
              size={20}
              aria-hidden="true"
            />
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
          <Search
            size={19}
            aria-hidden="true"
          />

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
              <X
                size={16}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <span className="requests-result-count">
          {filteredRequests.length} طلب
        </span>
      </section>

      {/* Filters */}
      <section className="requests-filter-row">
        <div className="requests-filter-group">
          <span className="requests-filter-label">
            الحالة
          </span>

          <div className="requests-filter-list">
            {statuses.map((status) => {
              const isActive =
                activeStatus === status;

              return (
                <button
                  type="button"
                  key={status}
                  className={`requests-filter ${
                    isActive
                      ? "requests-filter--active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveStatus(status)
                  }
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
            <Filter
              size={14}
              aria-hidden="true"
            />
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

          {hasFilters && (
            <button
              type="button"
              className="requests-clear-inline"
              onClick={clearFilters}
            >
              <X
                size={14}
                aria-hidden="true"
              />
              مسح الفلاتر
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="requests-empty">
            <div className="requests-empty__icon">
              <Loader2
                size={25}
                className="animate-spin"
                aria-hidden="true"
              />
            </div>

            <span className="requests-empty__eyebrow">
              جاري التحميل
            </span>

            <h3>
              جاري تحميل طلباتك
            </h3>

            <p>
              لحظات ونظهر لك جميع الطلبات الخاصة
              بحسابك.
            </p>
          </div>
        ) : error ? (
          <div className="requests-empty">
            <div className="requests-empty__icon">
              <X
                size={25}
                aria-hidden="true"
              />
            </div>

            <span className="requests-empty__eyebrow">
              حدث خطأ
            </span>

            <h3>
              تعذر تحميل الطلبات
            </h3>

            <p>{error}</p>

            <div className="requests-empty__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() =>
                  window.location.reload()
                }
              >
                إعادة المحاولة
              </button>

              <Link
                to="/requests/new"
                className="button button--primary"
              >
                إنشاء طلب جديد
              </Link>
            </div>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="request-list">
            {filteredRequests.map(
              (request, index) => (
                <Link
                  to={`/requests/${request.id}`}
                  className="request-card"
                  key={request.id}
                  style={
                    {
                      "--request-index": index,
                    } as CSSProperties
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

                    <p>
                      {request.description}
                    </p>
                  </div>

                  <div className="request-card__bottom">
                    <span>
                      {formatDate(
                        request.created_at,
                      )}
                    </span>

                    <span className="request-card__details">
                      عرض التفاصيل
                      <span aria-hidden="true">
                        ←
                      </span>
                    </span>
                  </div>
                </Link>
              ),
            )}
          </div>
        ) : (
          <div className="requests-empty">
            <div className="requests-empty__icon">
              <Search
                size={25}
                aria-hidden="true"
              />
            </div>

            <span className="requests-empty__eyebrow">
              لا توجد نتائج
            </span>

            <h3>
              {hasFilters
                ? "لم نجد أي طلبات مطابقة"
                : "لم ترسل أي طلبات بعد"}
            </h3>

            <p>
              {hasFilters
                ? "جرّب استخدام كلمة مختلفة أو غيّر الفلاتر لعرض المزيد من الطلبات."
                : "يمكنك إنشاء طلب جديد وسيظهر هنا تلقائيًا بعد إرساله."}
            </p>

            <div className="requests-empty__actions">
              {hasFilters && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={clearFilters}
                >
                  مسح الفلاتر
                </button>
              )}

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