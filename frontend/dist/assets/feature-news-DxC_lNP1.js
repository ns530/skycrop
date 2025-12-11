var O = Object.defineProperty,
  G = Object.defineProperties;
var Q = Object.getOwnPropertyDescriptors;
var k = Object.getOwnPropertySymbols;
var K = Object.prototype.hasOwnProperty,
  Y = Object.prototype.propertyIsEnumerable;
var A = (t, s, a) =>
    s in t
      ? O(t, s, { enumerable: !0, configurable: !0, writable: !0, value: a })
      : (t[s] = a),
  z = (t, s) => {
    for (var a in s || (s = {})) K.call(s, a) && A(t, a, s[a]);
    if (k) for (var a of k(s)) Y.call(s, a) && A(t, a, s[a]);
    return t;
  },
  $ = (t, s) => G(t, Q(s));
var y = (t, s, a) =>
  new Promise((n, l) => {
    var o = (i) => {
        try {
          g(a.next(i));
        } catch (h) {
          l(h);
        }
      },
      c = (i) => {
        try {
          g(a.throw(i));
        } catch (h) {
          l(h);
        }
      },
      g = (i) => (i.done ? n(i.value) : Promise.resolve(i.value).then(o, c));
    g((a = a.apply(t, s)).next());
  });
import { r as j, d as H } from "./chart-vendor-C7uCl44m.js";
import { j as e } from "./feature-admin-Bw8S4RZv.js";
import { a as F, u as R } from "./query-vendor-B8e9_Lvn.js";
import { a as E, b as J } from "./router-vendor-D1DOKBjT.js";
import {
  C as x,
  h as L,
  n as P,
  e as V,
  B as p,
  L as _,
  E as N,
} from "./shared-B32_tFWT.js";
const X = (t) => {
    const s = {
      "farming-tips": {
        label: "Farming Tips",
        color: "bg-green-100 text-green-800",
        icon: "🌾",
      },
      weather: {
        label: "Weather",
        color: "bg-blue-100 text-blue-800",
        icon: "🌤️",
      },
      "market-prices": {
        label: "Market Prices",
        color: "bg-yellow-100 text-yellow-800",
        icon: "💰",
      },
      "government-schemes": {
        label: "Gov Schemes",
        color: "bg-purple-100 text-purple-800",
        icon: "🏛️",
      },
      general: {
        label: "General",
        color: "bg-gray-100 text-gray-800",
        icon: "📰",
      },
    };
    return s[t || "general"] || s.general;
  },
  Z = (t) => {
    const s = new Date(t),
      n = new Date().getTime() - s.getTime(),
      l = Math.floor(n / (1e3 * 60 * 60 * 24));
    return l === 0
      ? "Today"
      : l === 1
        ? "Yesterday"
        : l < 7
          ? `${l} days ago`
          : l < 30
            ? `${Math.floor(l / 7)} weeks ago`
            : l < 365
              ? `${Math.floor(l / 30)} months ago`
              : s.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
  },
  ee = ({ article: t, onPrefetch: s }) => {
    const a = E(),
      n = X(t.category),
      l = () => {
        a(`/news/${t.id}`);
      },
      o = () => {
        s && s();
      };
    return e.jsx("div", {
      onClick: l,
      onMouseEnter: o,
      className:
        "cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]",
      children: e.jsx(x, {
        className: "h-full hover:shadow-lg transition-shadow",
        children: e.jsxs("div", {
          className: "flex flex-col gap-3",
          children: [
            t.imageUrl &&
              e.jsx("div", {
                className: "w-full h-48 rounded-lg overflow-hidden bg-gray-100",
                children: e.jsx("img", {
                  src: t.imageUrl,
                  alt: t.title,
                  className: "w-full h-full object-cover",
                  loading: "lazy",
                }),
              }),
            e.jsxs("div", {
              className: "flex items-start justify-between gap-2",
              children: [
                e.jsxs("span", {
                  className: `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${n.color}`,
                  children: [
                    e.jsx("span", { children: n.icon }),
                    e.jsx("span", { children: n.label }),
                  ],
                }),
                e.jsx("span", {
                  className: "text-xs text-gray-500 shrink-0",
                  children: Z(t.publishedAt),
                }),
              ],
            }),
            e.jsx("h3", {
              className:
                "text-lg font-semibold text-gray-900 line-clamp-2 hover:text-brand-blue transition-colors",
              children: t.title,
            }),
            e.jsx("p", {
              className: "text-sm text-gray-600 line-clamp-3",
              children: t.summary,
            }),
            e.jsxs("div", {
              className: "flex items-center justify-between pt-2 border-t",
              children: [
                t.author &&
                  e.jsxs("span", {
                    className: "text-xs text-gray-500",
                    children: ["By ", t.author],
                  }),
                t.viewCount !== void 0 &&
                  e.jsxs("span", {
                    className: "text-xs text-gray-500 flex items-center gap-1",
                    children: [
                      e.jsx("span", { children: "👁️" }),
                      e.jsxs("span", {
                        children: [t.viewCount.toLocaleString(), " views"],
                      }),
                    ],
                  }),
                e.jsx("span", {
                  className:
                    "text-xs font-medium text-brand-blue hover:underline",
                  children: "Read more →",
                }),
              ],
            }),
            t.tags &&
              t.tags.length > 0 &&
              e.jsxs("div", {
                className: "flex flex-wrap gap-1",
                children: [
                  t.tags
                    .slice(0, 3)
                    .map((c) =>
                      e.jsxs(
                        "span",
                        {
                          className:
                            "px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded",
                          children: ["#", c],
                        },
                        c,
                      ),
                    ),
                  t.tags.length > 3 &&
                    e.jsxs("span", {
                      className: "px-2 py-0.5 text-xs text-gray-500",
                      children: ["+", t.tags.length - 3, " more"],
                    }),
                ],
              }),
          ],
        }),
      }),
    });
  },
  U = (t) => ({
    id: t.id,
    title: t.title,
    summary: t.summary,
    body: t.body,
    category: t.category,
    imageUrl: t.image_url,
    author: t.author,
    publishedAt: t.published_at,
    viewCount: t.view_count,
    tags: t.tags,
  }),
  te = (t) => {
    var s;
    return t
      ? {
          page: t.page,
          pageSize: t.pageSize,
          sort: t.sort,
          order: t.order,
          category: t.category,
          search: t.search,
          tags: (s = t.tags) == null ? void 0 : s.join(","),
        }
      : {};
  },
  se = (t) =>
    y(void 0, null, function* () {
      try {
        const s = yield L.get("/admin/content", {
            params: $(z({}, te(t)), { status: "published" }),
          }),
          { data: a, pagination: n, meta: l } = s.data;
        return {
          data: a.map(U),
          pagination: { page: n.page, pageSize: n.pageSize, total: n.total },
          meta: l,
        };
      } catch (s) {
        throw P(s);
      }
    }),
  W = (t) =>
    y(void 0, null, function* () {
      try {
        const s = yield L.get(`/admin/content/${t}`);
        return U(s.data.data);
      } catch (s) {
        throw P(s);
      }
    }),
  ae = (t) =>
    y(void 0, null, function* () {
      try {
        console.log(`Tracking view for article: ${t}`);
      } catch (s) {
        console.warn("Failed to track article view:", s);
      }
    }),
  m = {
    all: ["news"],
    lists: () => [...m.all, "list"],
    list: (t) => [...m.lists(), t],
    details: () => [...m.all, "detail"],
    detail: (t) => [...m.details(), t],
    search: (t, s) => [...m.all, "search", t, s],
    category: (t, s) => [...m.all, "category", t, s],
  },
  re = (t) =>
    R({ queryKey: m.list(t), queryFn: () => se(t), staleTime: 5 * 60 * 1e3 }),
  le = (t) => (
    F(),
    R({
      queryKey: m.detail(t),
      queryFn: () =>
        y(void 0, null, function* () {
          const s = yield W(t);
          return (ae(t).catch(() => {}), s);
        }),
      enabled: !!t,
      staleTime: 10 * 60 * 1e3,
    })
  ),
  ne = () => {
    const t = F();
    return (s) => {
      t.prefetchQuery({
        queryKey: m.detail(s),
        queryFn: () => W(s),
        staleTime: 10 * 60 * 1e3,
      });
    };
  },
  ie = [
    { value: "all", label: "All", icon: "📰" },
    { value: "farming-tips", label: "Farming Tips", icon: "🌾" },
    { value: "weather", label: "Weather", icon: "🌤️" },
    { value: "market-prices", label: "Market Prices", icon: "💰" },
    { value: "government-schemes", label: "Gov Schemes", icon: "🏛️" },
  ],
  M = () => {
    var C;
    const { isOnline: t } = V(),
      [s, a] = j.useState("all"),
      [n, l] = j.useState(""),
      [o, c] = j.useState(1),
      g = ne(),
      {
        data: i,
        isLoading: h,
        isError: S,
        error: v,
        refetch: B,
        isFetching: f,
      } = re({
        page: o,
        pageSize: 12,
        category: s === "all" ? void 0 : s,
        search: n || void 0,
      }),
      u = (i == null ? void 0 : i.data) || [],
      d = i == null ? void 0 : i.pagination,
      D = (r) => {
        (r.preventDefault(), c(1));
      },
      q = (r) => {
        (a(r), c(1));
      },
      w = (r) => {
        (c(r), window.scrollTo({ top: 0, behavior: "smooth" }));
      };
    return e.jsxs("section", {
      "aria-labelledby": "news-heading",
      className: "space-y-6",
      children: [
        e.jsxs("header", {
          className: "space-y-2",
          children: [
            e.jsx("h1", {
              id: "news-heading",
              className: "text-2xl font-bold text-gray-900",
              children: "📰 Knowledge Hub",
            }),
            e.jsx("p", {
              className: "text-sm text-gray-600",
              children:
                "Stay updated with farming tips, weather updates, market prices, and government schemes",
            }),
            !t &&
              e.jsxs("p", {
                className: "flex items-center gap-2 text-xs text-amber-700",
                children: [
                  e.jsx("span", {
                    className: "inline-block h-2 w-2 rounded-full bg-amber-500",
                    "aria-hidden": "true",
                  }),
                  u.length > 0
                    ? "You are offline. Showing cached articles."
                    : "You are offline and have no cached articles yet.",
                ],
              }),
          ],
        }),
        e.jsx(x, {
          children: e.jsxs("form", {
            onSubmit: D,
            className: "flex gap-2",
            children: [
              e.jsx("input", {
                type: "search",
                value: n,
                onChange: (r) => l(r.target.value),
                placeholder: "Search articles...",
                className:
                  "flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue",
              }),
              e.jsx(p, { type: "submit", size: "md", children: "Search" }),
            ],
          }),
        }),
        e.jsx("div", {
          className: "flex flex-wrap gap-2",
          children: ie.map((r) =>
            e.jsxs(
              "button",
              {
                onClick: () => q(r.value),
                className: `
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${s === r.value ? "bg-brand-blue text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}
            `,
                children: [
                  e.jsx("span", { children: r.icon }),
                  e.jsx("span", { children: r.label }),
                ],
              },
              r.value,
            ),
          ),
        }),
        d &&
          e.jsxs("div", {
            className:
              "flex items-center justify-between text-sm text-gray-600",
            children: [
              e.jsxs("p", {
                children: [
                  "Showing ",
                  u.length,
                  " of ",
                  d.total,
                  " articles",
                  n && ` for "${n}"`,
                ],
              }),
              f &&
                e.jsx("span", {
                  className: "text-xs",
                  children: "Refreshing...",
                }),
            ],
          }),
        h && !u.length && e.jsx(_, { message: "Loading articles..." }),
        S &&
          !u.length &&
          e.jsx(N, {
            title: "Unable to load articles",
            message:
              (C = v == null ? void 0 : v.message) != null
                ? C
                : "Something went wrong while loading articles.",
            onRetry: B,
          }),
        !h &&
          !S &&
          u.length === 0 &&
          e.jsx(x, {
            children: e.jsxs("div", {
              className: "text-center py-12",
              children: [
                e.jsx("div", {
                  className: "text-6xl mb-4",
                  children: n ? "🔍" : "📰",
                }),
                e.jsx("h3", {
                  className: "text-lg font-semibold text-gray-900 mb-2",
                  children: n ? "No articles found" : "No articles available",
                }),
                e.jsx("p", {
                  className: "text-sm text-gray-600 mb-4",
                  children: n
                    ? `No articles match your search "${n}". Try different keywords.`
                    : "Check back later for new articles and updates.",
                }),
                n &&
                  e.jsx(p, {
                    variant: "secondary",
                    size: "sm",
                    onClick: () => {
                      (l(""), c(1));
                    },
                    children: "Clear Search",
                  }),
              ],
            }),
          }),
        u.length > 0 &&
          e.jsx("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            children: u.map((r) =>
              e.jsx(ee, { article: r, onPrefetch: () => g(r.id) }, r.id),
            ),
          }),
        d &&
          d.total > d.pageSize &&
          e.jsx(x, {
            children: e.jsxs("div", {
              className: "flex items-center justify-between",
              children: [
                e.jsx(p, {
                  variant: "secondary",
                  size: "sm",
                  onClick: () => w(o - 1),
                  disabled: o === 1 || f,
                  children: "← Previous",
                }),
                e.jsx("div", {
                  className: "flex items-center gap-2",
                  children: Array.from(
                    { length: Math.ceil(d.total / d.pageSize) },
                    (r, b) => b + 1,
                  )
                    .filter(
                      (r) =>
                        r === 1 ||
                        r === Math.ceil(d.total / d.pageSize) ||
                        Math.abs(r - o) <= 1,
                    )
                    .map((r, b, I) =>
                      e.jsxs(
                        H.Fragment,
                        {
                          children: [
                            b > 0 &&
                              I[b - 1] !== r - 1 &&
                              e.jsx("span", {
                                className: "text-gray-400",
                                children: "...",
                              }),
                            e.jsx("button", {
                              onClick: () => w(r),
                              disabled: f,
                              className: `
                        w-8 h-8 rounded text-sm font-medium transition-colors
                        ${o === r ? "bg-brand-blue text-white" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"}
                      `,
                              children: r,
                            }),
                          ],
                        },
                        r,
                      ),
                    ),
                }),
                e.jsx(p, {
                  variant: "secondary",
                  size: "sm",
                  onClick: () => w(o + 1),
                  disabled: o >= Math.ceil(d.total / d.pageSize) || f,
                  children: "Next →",
                }),
              ],
            }),
          }),
      ],
    });
  },
  ye = Object.freeze(
    Object.defineProperty(
      { __proto__: null, NewsListPage: M, default: M },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  oe = (t) => {
    const s = {
      "farming-tips": {
        label: "Farming Tips",
        color: "bg-green-100 text-green-800",
        icon: "🌾",
      },
      weather: {
        label: "Weather",
        color: "bg-blue-100 text-blue-800",
        icon: "🌤️",
      },
      "market-prices": {
        label: "Market Prices",
        color: "bg-yellow-100 text-yellow-800",
        icon: "💰",
      },
      "government-schemes": {
        label: "Gov Schemes",
        color: "bg-purple-100 text-purple-800",
        icon: "🏛️",
      },
      general: {
        label: "General",
        color: "bg-gray-100 text-gray-800",
        icon: "📰",
      },
    };
    return s[t || "general"] || s.general;
  },
  ce = (t) =>
    new Date(t).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  T = () => {
    var i;
    const { id: t } = J(),
      s = E(),
      { data: a, isLoading: n, isError: l, error: o, refetch: c } = le(t || "");
    if (
      (j.useEffect(() => {
        window.scrollTo({ top: 0 });
      }, []),
      !t)
    )
      return e.jsx(N, {
        title: "Article not found",
        message: "No article ID provided.",
        onRetry: () => s("/news"),
      });
    if (n) return e.jsx(_, { message: "Loading article..." });
    if (l || !a)
      return e.jsx(N, {
        title: "Unable to load article",
        message:
          (i = o == null ? void 0 : o.message) != null
            ? i
            : "Something went wrong while loading this article.",
        onRetry: c,
      });
    const g = oe(a.category);
    return e.jsxs("article", {
      className: "space-y-6 max-w-4xl mx-auto",
      children: [
        e.jsx("div", {
          children: e.jsx(p, {
            variant: "secondary",
            size: "sm",
            onClick: () => s("/news"),
            children: "← Back to Articles",
          }),
        }),
        e.jsx(x, {
          children: e.jsxs("div", {
            className: "space-y-4",
            children: [
              e.jsx("div", {
                children: e.jsxs("span", {
                  className: `inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${g.color}`,
                  children: [
                    e.jsx("span", { children: g.icon }),
                    e.jsx("span", { children: g.label }),
                  ],
                }),
              }),
              e.jsx("h1", {
                className: "text-3xl md:text-4xl font-bold text-gray-900",
                children: a.title,
              }),
              e.jsxs("div", {
                className:
                  "flex flex-wrap items-center gap-4 text-sm text-gray-600",
                children: [
                  a.author &&
                    e.jsx("div", {
                      className: "flex items-center gap-2",
                      children: e.jsxs("span", {
                        className: "font-medium",
                        children: ["By ", a.author],
                      }),
                    }),
                  e.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      e.jsx("span", { children: "📅" }),
                      e.jsx("span", { children: ce(a.publishedAt) }),
                    ],
                  }),
                  a.viewCount !== void 0 &&
                    e.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        e.jsx("span", { children: "👁️" }),
                        e.jsxs("span", {
                          children: [a.viewCount.toLocaleString(), " views"],
                        }),
                      ],
                    }),
                ],
              }),
              e.jsx("p", {
                className: "text-lg text-gray-700 leading-relaxed",
                children: a.summary,
              }),
              a.tags &&
                a.tags.length > 0 &&
                e.jsx("div", {
                  className: "flex flex-wrap gap-2 pt-2",
                  children: a.tags.map((h) =>
                    e.jsxs(
                      "span",
                      {
                        className:
                          "px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full",
                        children: ["#", h],
                      },
                      h,
                    ),
                  ),
                }),
            ],
          }),
        }),
        a.imageUrl &&
          e.jsx("div", {
            className:
              "w-full rounded-lg overflow-hidden bg-gray-100 shadow-md",
            children: e.jsx("img", {
              src: a.imageUrl,
              alt: a.title,
              className: "w-full h-auto max-h-[500px] object-cover",
            }),
          }),
        e.jsx(x, {
          children: e.jsx("div", {
            className: "prose prose-sm md:prose-base max-w-none",
            dangerouslySetInnerHTML: { __html: de(a.body) },
          }),
        }),
        e.jsx(x, {
          title: "Share this article",
          children: e.jsxs("div", {
            className: "flex items-center gap-4",
            children: [
              e.jsx("p", {
                className: "text-sm text-gray-600",
                children: "Found this helpful? Share with fellow farmers!",
              }),
              e.jsx("div", {
                className: "flex gap-2",
                children: e.jsx(p, {
                  variant: "secondary",
                  size: "sm",
                  disabled: !0,
                  children: "Share",
                }),
              }),
            ],
          }),
        }),
        e.jsx(x, {
          title: "Related Articles",
          children: e.jsx("p", {
            className: "text-sm text-gray-600",
            children: "More articles coming soon...",
          }),
        }),
        e.jsx("div", {
          className: "flex justify-center",
          children: e.jsx(p, {
            variant: "secondary",
            size: "md",
            onClick: () => s("/news"),
            children: "← Back to All Articles",
          }),
        }),
      ],
    });
  },
  de = (t) =>
    /<\/?[a-z][\s\S]*>/i.test(t)
      ? t
      : t
          .split(
            `

`,
          )
          .map((s) => {
            const a = s.trim();
            return a
              ? a.startsWith("# ")
                ? `<h2 class="text-2xl font-bold mt-6 mb-3">${a.substring(2)}</h2>`
                : a.startsWith("## ")
                  ? `<h3 class="text-xl font-semibold mt-4 mb-2">${a.substring(3)}</h3>`
                  : a.startsWith("- ") || a.startsWith("* ")
                    ? `<ul class="list-disc my-3">${s
                        .split(
                          `
`,
                        )
                        .filter(
                          (l) =>
                            l.trim().startsWith("-") ||
                            l.trim().startsWith("*"),
                        )
                        .map(
                          (l) =>
                            `<li class="ml-4">${l.trim().substring(2)}</li>`,
                        ).join(`
`)}</ul>`
                    : `<p class="mb-4 leading-relaxed">${a}</p>`
              : "";
          }).join(`
`),
  fe = Object.freeze(
    Object.defineProperty(
      { __proto__: null, ArticleDetailPage: T, default: T },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  );
export { fe as A, ye as N };
