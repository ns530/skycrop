var Ne = Object.defineProperty,
  we = Object.defineProperties;
var Se = Object.getOwnPropertyDescriptors;
var se = Object.getOwnPropertySymbols;
var Ce = Object.prototype.hasOwnProperty,
  ke = Object.prototype.propertyIsEnumerable;
var ae = (s, t, a) =>
    t in s
      ? Ne(s, t, { enumerable: !0, configurable: !0, writable: !0, value: a })
      : (s[t] = a),
  ne = (s, t) => {
    for (var a in t || (t = {})) Ce.call(t, a) && ae(s, a, t[a]);
    if (se) for (var a of se(t)) ke.call(t, a) && ae(s, a, t[a]);
    return s;
  },
  re = (s, t) => we(s, Se(t));
var v = (s, t, a) =>
  new Promise((n, r) => {
    var d = (o) => {
        try {
          u(a.next(o));
        } catch (p) {
          r(p);
        }
      },
      m = (o) => {
        try {
          u(a.throw(o));
        } catch (p) {
          r(p);
        }
      },
      u = (o) => (o.done ? n(o.value) : Promise.resolve(o.value).then(d, m));
    u((a = a.apply(s, t)).next());
  });
import { r as C } from "./chart-vendor-C7uCl44m.js";
import { u as Z, a as oe, b as xe } from "./query-vendor-B8e9_Lvn.js";
import {
  h as R,
  n as I,
  a as X,
  u as E,
  C as g,
  B as x,
  M as V,
} from "./shared-B32_tFWT.js";
var me = { exports: {} },
  $ = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Ae = C,
  _e = Symbol.for("react.element"),
  Pe = Symbol.for("react.fragment"),
  Te = Object.prototype.hasOwnProperty,
  ze = Ae.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  Ue = { key: !0, ref: !0, __self: !0, __source: !0 };
function ue(s, t, a) {
  var n,
    r = {},
    d = null,
    m = null;
  (a !== void 0 && (d = "" + a),
    t.key !== void 0 && (d = "" + t.key),
    t.ref !== void 0 && (m = t.ref));
  for (n in t) Te.call(t, n) && !Ue.hasOwnProperty(n) && (r[n] = t[n]);
  if (s && s.defaultProps)
    for (n in ((t = s.defaultProps), t)) r[n] === void 0 && (r[n] = t[n]);
  return {
    $$typeof: _e,
    type: s,
    key: d,
    ref: m,
    props: r,
    _owner: ze.current,
  };
}
$.Fragment = Pe;
$.jsx = ue;
$.jsxs = ue;
me.exports = $;
var e = me.exports;
const he = "/admin/users",
  G = "/admin/content",
  Fe = "/admin/system-status",
  pe = (s) => {
    if (!s) return;
    const t = {};
    return (
      typeof s.page == "number" && (t.page = s.page),
      typeof s.pageSize == "number" && (t.pageSize = s.pageSize),
      s.search && (t.search = s.search),
      s.sort && (t.sort = s.sort),
      s.order && (t.order = s.order),
      t
    );
  },
  ge = (s) => {
    var t, a;
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      status: (t = s.status) != null ? t : "active",
      lastActiveAt: (a = s.last_active_at) != null ? a : void 0,
    };
  },
  ye = (s) => {
    var t, a;
    return {
      id: s.id,
      title: s.title,
      summary: s.summary,
      body: s.body,
      status: (t = s.status) != null ? t : "draft",
      publishedAt: (a = s.published_at) != null ? a : void 0,
    };
  },
  Re = (s) => ({
    mlService: s.ml_service,
    api: s.api,
    satelliteIngest: s.satellite_ingest,
  }),
  Ie = (s) =>
    v(void 0, null, function* () {
      try {
        const t = yield R.get(he, { params: pe(s) }),
          { data: a, pagination: n, meta: r } = t.data;
        return {
          data: a.map(ge),
          pagination: { page: n.page, pageSize: n.pageSize, total: n.total },
          meta: r,
        };
      } catch (t) {
        throw I(t);
      }
    }),
  Le = (s, t) =>
    v(void 0, null, function* () {
      try {
        const a = yield R.patch(`${he}/${s}/status`, { status: t });
        return ge(a.data.data);
      } catch (a) {
        throw I(a);
      }
    }),
  Me = (s) =>
    v(void 0, null, function* () {
      try {
        const t = yield R.get(G, { params: pe(s) }),
          { data: a, pagination: n, meta: r } = t.data;
        return {
          data: a.map(ye),
          pagination: { page: n.page, pageSize: n.pageSize, total: n.total },
          meta: r,
        };
      } catch (t) {
        throw I(t);
      }
    }),
  De = (s) =>
    v(void 0, null, function* () {
      try {
        const t = {
            title: s.title,
            summary: s.summary,
            body: s.body,
            status: s.status,
            published_at: s.publishedAt,
          },
          a = !!s.id,
          n = a ? "put" : "post",
          r = a ? `${G}/${s.id}` : G,
          d = yield R[n](r, t);
        return ye(d.data.data);
      } catch (t) {
        throw I(t);
      }
    }),
  Oe = () =>
    v(void 0, null, function* () {
      try {
        const s = yield R.get(Fe);
        return Re(s.data.data);
      } catch (s) {
        throw I(s);
      }
    }),
  fe = (s) =>
    Z({
      queryKey: X.users(s),
      queryFn: () => Ie(s),
      placeholderData: (t) => t,
    }),
  Ee = () => {
    const s = oe();
    return xe({
      mutationFn: ({ id: t, status: a }) => Le(t, a),
      onSuccess: () => {
        s.invalidateQueries({ queryKey: ["admin", "users"] });
      },
    });
  },
  je = (s) =>
    Z({
      queryKey: X.content(s),
      queryFn: () => Me(s),
      placeholderData: (t) => t,
    }),
  $e = () => {
    const s = oe();
    return xe({
      mutationFn: (t) => De(t),
      onSuccess: () => {
        s.invalidateQueries({ queryKey: ["admin", "content"] });
      },
    });
  },
  be = () =>
    Z({ queryKey: X.systemStatus, queryFn: () => Oe(), staleTime: 3e4 }),
  O = (s) => {
    switch (s) {
      case "up":
        return "excellent";
      case "degraded":
        return "fair";
      case "down":
        return "poor";
      default:
        return "default";
    }
  },
  H = (s) => {
    switch (s) {
      case "up":
        return "OK";
      case "degraded":
        return "Degraded";
      case "down":
        return "Down";
      default:
        return "Unknown";
    }
  },
  K = (s) => {
    switch (s) {
      case "up":
        return "inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent";
      case "degraded":
        return "inline-flex items-center rounded-full bg-status-fair/10 px-2 py-0.5 text-xs font-medium text-status-fair";
      case "down":
        return "inline-flex items-center rounded-full bg-status-poor/10 px-2 py-0.5 text-xs font-medium text-status-poor";
      default:
        return "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500";
    }
  },
  ie = () => {
    var c;
    const { showToast: s } = E(),
      {
        data: t,
        isLoading: a,
        isError: n,
        error: r,
        refetch: d,
        isFetching: m,
      } = be(),
      { data: u, isLoading: o } = fe({ page: 1, pageSize: 1 }),
      { data: p, isLoading: y } = je({ page: 1, pageSize: 1 }),
      N = C.useMemo(() => {
        if (!(!u || o)) return u.pagination.total;
      }, [u, o]),
      S = C.useMemo(() => {
        if (!(!p || y)) return p.pagination.total;
      }, [p, y]),
      h = () =>
        v(void 0, null, function* () {
          var P;
          try {
            (yield d(),
              s({ title: "System status refreshed", variant: "success" }));
          } catch (F) {
            const A = r != null ? r : F;
            s({
              title: "Failed to refresh system status",
              description:
                (P = A == null ? void 0 : A.message) != null
                  ? P
                  : "Something went wrong while checking system status.",
              variant: "error",
            });
          }
        }),
      k = () =>
        a && !t
          ? e.jsx("p", {
              className: "text-sm text-gray-500",
              children: "Checking system status…",
            })
          : n && !t
            ? e.jsxs("div", {
                className: "flex flex-col gap-2 text-sm",
                children: [
                  e.jsx("p", {
                    className: "text-red-600",
                    children: "Unable to load system status.",
                  }),
                  e.jsx(x, {
                    size: "sm",
                    variant: "secondary",
                    onClick: h,
                    children: "Retry",
                  }),
                ],
              })
            : t
              ? e.jsxs("dl", {
                  className: "grid grid-cols-1 gap-2 text-sm sm:grid-cols-3",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center justify-between gap-2",
                      children: [
                        e.jsx("dt", {
                          className: "text-gray-600",
                          children: "API",
                        }),
                        e.jsx("dd", {
                          className: K(t.api),
                          children: H(t.api),
                        }),
                      ],
                    }),
                    e.jsxs("div", {
                      className: "flex items-center justify-between gap-2",
                      children: [
                        e.jsx("dt", {
                          className: "text-gray-600",
                          children: "ML service",
                        }),
                        e.jsx("dd", {
                          className: K(t.mlService),
                          children: H(t.mlService),
                        }),
                      ],
                    }),
                    e.jsxs("div", {
                      className: "flex items-center justify-between gap-2",
                      children: [
                        e.jsx("dt", {
                          className: "text-gray-600",
                          children: "Satellite ingest",
                        }),
                        e.jsx("dd", {
                          className: K(t.satelliteIngest),
                          children: H(t.satelliteIngest),
                        }),
                      ],
                    }),
                  ],
                })
              : e.jsx("p", {
                  className: "text-sm text-gray-500",
                  children: "System status is currently unavailable.",
                });
    return e.jsxs("section", {
      "aria-labelledby": "admin-overview-heading",
      className: "space-y-4",
      children: [
        e.jsxs("header", {
          className: "space-y-1",
          children: [
            e.jsx("h1", {
              id: "admin-overview-heading",
              className: "text-lg font-semibold text-gray-900",
              children: "Admin overview",
            }),
            e.jsx("p", {
              className: "text-sm text-gray-600",
              children:
                "System status and key metrics for SkyCrop. Use this dashboard to monitor platform health and activity.",
            }),
          ],
        }),
        e.jsxs("div", {
          className: "grid grid-cols-1 gap-4 md:grid-cols-4",
          children: [
            e.jsxs(g, {
              title: "Active farmers",
              showStatusStripe: !0,
              status: "excellent",
              children: [
                e.jsx("p", {
                  className: "text-2xl font-semibold text-gray-900",
                  children: N != null ? N : "—",
                }),
                e.jsx("p", {
                  className: "mt-1 text-xs text-gray-500",
                  children:
                    "Approximated using total user count. Filtering by role/status will be wired in a future iteration.",
                }),
              ],
            }),
            e.jsxs(g, {
              title: "Fields monitored",
              showStatusStripe: !0,
              status: "fair",
              children: [
                e.jsx("p", {
                  className: "text-2xl font-semibold text-gray-900",
                  children: "—",
                }),
                e.jsx("p", {
                  className: "mt-1 text-xs text-gray-500",
                  children:
                    "Placeholder metric. Will be derived from field inventories in a future iteration.",
                }),
              ],
            }),
            e.jsxs(g, {
              title: "Content items",
              showStatusStripe: !0,
              status: "excellent",
              children: [
                e.jsx("p", {
                  className: "text-2xl font-semibold text-gray-900",
                  children: S != null ? S : "—",
                }),
                e.jsx("p", {
                  className: "mt-1 text-xs text-gray-500",
                  children:
                    "Total news and articles currently managed in the system.",
                }),
              ],
            }),
            e.jsxs(g, {
              title: "System health",
              showStatusStripe: !0,
              status: O(t == null ? void 0 : t.api),
              children: [
                k(),
                m &&
                  e.jsx("p", {
                    className: "mt-2 text-xs text-gray-500",
                    children: "Refreshing status…",
                  }),
              ],
            }),
          ],
        }),
        e.jsxs(g, {
          title: "Detailed system status",
          className: "mt-2",
          children: [
            a &&
              !t &&
              e.jsx("p", {
                className: "text-sm text-gray-500",
                children: "Checking system status…",
              }),
            n &&
              !t &&
              e.jsxs("div", {
                className: "flex flex-col gap-3 text-sm",
                children: [
                  e.jsxs("p", {
                    className: "text-red-600",
                    children: [
                      "Unable to load system status: ",
                      (c = r == null ? void 0 : r.message) != null
                        ? c
                        : "Unknown error",
                      ".",
                    ],
                  }),
                  e.jsx("div", {
                    className: "flex flex-wrap gap-2",
                    children: e.jsx(x, {
                      size: "sm",
                      variant: "secondary",
                      onClick: h,
                      children: "Retry",
                    }),
                  }),
                ],
              }),
            !a &&
              !n &&
              t &&
              e.jsxs("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                  e.jsx(g, {
                    title: "API",
                    status: O(t.api),
                    showStatusStripe: !0,
                    className: "border-0 shadow-none",
                    children: e.jsxs("p", {
                      className: "text-sm text-gray-700",
                      children: [
                        t.api === "up" &&
                          "Core APIs are responding within expected latency.",
                        t.api === "degraded" &&
                          "API is degraded. Expect slower responses and occasional timeouts.",
                        t.api === "down" &&
                          "API is currently unavailable. Farmers may not be able to access latest data.",
                      ],
                    }),
                  }),
                  e.jsx(g, {
                    title: "ML service",
                    status: O(t.mlService),
                    showStatusStripe: !0,
                    className: "border-0 shadow-none",
                    children: e.jsxs("p", {
                      className: "text-sm text-gray-700",
                      children: [
                        t.mlService === "up" &&
                          "Model predictions for health and yield are running normally.",
                        t.mlService === "degraded" &&
                          "ML service is degraded. Recommendations may be slower than usual.",
                        t.mlService === "down" &&
                          "ML service is unavailable. Health insights and recommendations may be stale.",
                      ],
                    }),
                  }),
                  e.jsx(g, {
                    title: "Satellite ingest",
                    status: O(t.satelliteIngest),
                    showStatusStripe: !0,
                    className: "border-0 shadow-none",
                    children: e.jsxs("p", {
                      className: "text-sm text-gray-700",
                      children: [
                        t.satelliteIngest === "up" &&
                          "Satellite scenes are being ingested and processed as expected.",
                        t.satelliteIngest === "degraded" &&
                          "Satellite ingest is degraded. Expect delays before new imagery appears.",
                        t.satelliteIngest === "down" &&
                          "Satellite ingest is down. New acquisitions will not be processed until this is resolved.",
                      ],
                    }),
                  }),
                ],
              }),
          ],
        }),
        e.jsx(g, {
          title: "Quick admin actions",
          children: e.jsxs("div", {
            className: "flex flex-wrap gap-2",
            children: [
              e.jsx(x, {
                size: "sm",
                variant: "primary",
                children: "Manage users",
              }),
              e.jsx(x, {
                size: "sm",
                variant: "secondary",
                children: "Review content",
              }),
              e.jsx(x, {
                size: "sm",
                variant: "ghost",
                onClick: h,
                children: "Refresh system status",
              }),
            ],
          }),
        }),
      ],
    });
  },
  Ye = Object.freeze(
    Object.defineProperty(
      { __proto__: null, AdminOverviewPage: ie, default: ie },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  qe = (s) => {
    if (!s) return "—";
    const t = new Date(s);
    return Number.isNaN(t.getTime()) ? s : t.toLocaleString();
  },
  le = () => {
    var M, z;
    const { showToast: s } = E(),
      [t, a] = C.useState("all"),
      [n, r] = C.useState("all"),
      {
        data: d,
        isLoading: m,
        isError: u,
        error: o,
        refetch: p,
        isFetching: y,
      } = fe({ page: 1, pageSize: 50 }),
      N = (M = d == null ? void 0 : d.data) != null ? M : [],
      S = C.useMemo(
        () =>
          N.filter((l) => {
            const f = t === "all" ? !0 : l.role.toLowerCase() === t,
              b = n === "all" ? !0 : l.status === n;
            return f && b;
          }),
        [N, t, n],
      ),
      { mutateAsync: h, isPending: k } = Ee(),
      [c, P] = C.useState(null),
      F = (l, f) => {
        P({ user: l, nextStatus: f });
      },
      A = () => {
        P(null);
      },
      L = () =>
        v(void 0, null, function* () {
          var l;
          try {
            yield p();
          } catch (f) {
            const b = o != null ? o : f;
            s({
              title: "Failed to load users",
              description:
                (l = b == null ? void 0 : b.message) != null
                  ? l
                  : "Something went wrong while fetching users.",
              variant: "error",
            });
          }
        }),
      T = () =>
        v(void 0, null, function* () {
          var l;
          if (c)
            try {
              (yield h({ id: c.user.id, status: c.nextStatus }),
                s({
                  title: "User status updated",
                  description: `${c.user.email} is now ${c.nextStatus}.`,
                  variant: "success",
                }),
                A());
            } catch (f) {
              const b = f;
              s({
                title: "Failed to update user",
                description:
                  (l = b == null ? void 0 : b.message) != null
                    ? l
                    : "Something went wrong while updating the user status.",
                variant: "error",
              });
            }
        }),
      q = (l) =>
        l === "active"
          ? e.jsx("span", {
              className:
                "inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent",
              children: "Active",
            })
          : e.jsx("span", {
              className:
                "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500",
              children: "Disabled",
            }),
      B = (l) => {
        const f = l.status === "active",
          b = f ? "disabled" : "active";
        return e.jsxs(
          "tr",
          {
            className: "hover:bg-gray-50 text-gray-900",
            children: [
              e.jsx("td", {
                className: "px-4 py-3 text-sm font-medium",
                children: l.name,
              }),
              e.jsx("td", {
                className: "px-4 py-3 text-xs text-gray-700",
                children: l.email,
              }),
              e.jsx("td", {
                className: "px-4 py-3 text-xs text-gray-700 capitalize",
                children: l.role,
              }),
              e.jsx("td", {
                className: "px-4 py-3 text-xs",
                children: q(l.status),
              }),
              e.jsx("td", {
                className: "px-4 py-3 text-xs text-gray-600",
                children: qe(l.lastActiveAt),
              }),
              e.jsx("td", {
                className: "px-4 py-3 text-right",
                children: e.jsx(x, {
                  size: "sm",
                  variant: f ? "secondary" : "primary",
                  onClick: () => F(l, b),
                  children: f ? "Disable" : "Enable",
                }),
              }),
            ],
          },
          l.id,
        );
      };
    return e.jsxs("section", {
      "aria-labelledby": "admin-users-heading",
      className: "space-y-4",
      children: [
        e.jsx("header", {
          className:
            "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
          children: e.jsxs("div", {
            children: [
              e.jsx("h1", {
                id: "admin-users-heading",
                className: "text-lg font-semibold text-gray-900",
                children: "User management",
              }),
              e.jsx("p", {
                className: "text-sm text-gray-600",
                children: "View and manage farmer and admin accounts.",
              }),
            ],
          }),
        }),
        e.jsxs(g, {
          children: [
            e.jsxs("div", {
              className:
                "flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3 mb-3 text-xs",
              children: [
                e.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    e.jsx("span", {
                      className: "text-gray-600",
                      children: "Role",
                    }),
                    e.jsxs("select", {
                      value: t,
                      onChange: (l) => a(l.target.value),
                      className:
                        "inline-flex h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue",
                      children: [
                        e.jsx("option", { value: "all", children: "All" }),
                        e.jsx("option", {
                          value: "farmer",
                          children: "Farmer",
                        }),
                        e.jsx("option", { value: "admin", children: "Admin" }),
                      ],
                    }),
                  ],
                }),
                e.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    e.jsx("span", {
                      className: "text-gray-600",
                      children: "Status",
                    }),
                    e.jsxs("select", {
                      value: n,
                      onChange: (l) => r(l.target.value),
                      className:
                        "inline-flex h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue",
                      children: [
                        e.jsx("option", { value: "all", children: "All" }),
                        e.jsx("option", {
                          value: "active",
                          children: "Active",
                        }),
                        e.jsx("option", {
                          value: "disabled",
                          children: "Disabled",
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsx("div", {
                  className: "ml-auto text-gray-500",
                  children: y
                    ? "Refreshing users…"
                    : `Total users: ${(z = d == null ? void 0 : d.pagination.total) != null ? z : 0}`,
                }),
              ],
            }),
            e.jsx("div", {
              className: "overflow-x-auto",
              children: e.jsxs("table", {
                className:
                  "min-w-full divide-y divide-gray-100 text-left text-sm",
                children: [
                  e.jsx("thead", {
                    className: "bg-gray-50",
                    children: e.jsxs("tr", {
                      children: [
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Name",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Email",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Role",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Status",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Last active",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right",
                          children: "Actions",
                        }),
                      ],
                    }),
                  }),
                  e.jsxs("tbody", {
                    className: "divide-y divide-gray-100",
                    children: [
                      m &&
                        e.jsx("tr", {
                          children: e.jsx("td", {
                            colSpan: 6,
                            className:
                              "px-4 py-6 text-center text-sm text-gray-500",
                            children: "Loading users…",
                          }),
                        }),
                      !m &&
                        u &&
                        e.jsx("tr", {
                          children: e.jsx("td", {
                            colSpan: 6,
                            className:
                              "px-4 py-6 text-center text-sm text-red-600",
                            children: e.jsxs("div", {
                              className: "flex flex-col items-center gap-3",
                              children: [
                                e.jsx("p", {
                                  children: "Unable to load users.",
                                }),
                                e.jsx(x, {
                                  size: "sm",
                                  variant: "secondary",
                                  onClick: L,
                                  children: "Retry",
                                }),
                              ],
                            }),
                          }),
                        }),
                      !m &&
                        !u &&
                        S.length === 0 &&
                        e.jsx("tr", {
                          children: e.jsx("td", {
                            colSpan: 6,
                            className:
                              "px-4 py-6 text-center text-sm text-gray-500",
                            children: "No users match the selected filters.",
                          }),
                        }),
                      !m && !u && S.map(B),
                    ],
                  }),
                ],
              }),
            }),
          ],
        }),
        e.jsx(V, {
          isOpen: !!c,
          onClose: A,
          title: "Change user status",
          children:
            c &&
            e.jsxs("div", {
              className: "space-y-3",
              children: [
                e.jsxs("p", {
                  className: "text-sm text-gray-700",
                  children: [
                    "You are about to change the status for",
                    " ",
                    e.jsx("span", {
                      className: "font-medium",
                      children: c.user.email,
                    }),
                    " to",
                    " ",
                    e.jsx("span", {
                      className: "font-medium",
                      children: c.nextStatus,
                    }),
                    ".",
                  ],
                }),
                e.jsx("p", {
                  className: "text-xs text-gray-500",
                  children:
                    "Disabled users will not be able to sign in or access the platform until re-enabled.",
                }),
                e.jsxs("div", {
                  className: "flex justify-end gap-2 pt-2",
                  children: [
                    e.jsx(x, {
                      size: "sm",
                      variant: "secondary",
                      onClick: A,
                      disabled: k,
                      children: "Cancel",
                    }),
                    e.jsx(x, {
                      size: "sm",
                      variant: "primary",
                      onClick: T,
                      disabled: k,
                      children: k ? "Updating…" : "Confirm",
                    }),
                  ],
                }),
              ],
            }),
        }),
      ],
    });
  },
  We = Object.freeze(
    Object.defineProperty(
      { __proto__: null, AdminUsersPage: le, default: le },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  Q = (s) =>
    s
      ? {
          id: s.id,
          title: s.title,
          summary: s.summary,
          body: s.body,
          status: s.status,
        }
      : { id: void 0, title: "", summary: "", body: "", status: "draft" },
  ce = () => {
    var ee, te;
    const { showToast: s } = E(),
      {
        data: t,
        isLoading: a,
        isError: n,
        error: r,
        refetch: d,
        isFetching: m,
      } = je({ page: 1, pageSize: 50 }),
      u = (ee = t == null ? void 0 : t.data) != null ? ee : [],
      o = (te = t == null ? void 0 : t.pagination.total) != null ? te : 0,
      { mutateAsync: p, isPending: y } = $e(),
      [N, S] = C.useState(!1),
      [h, k] = C.useState(() => Q()),
      [c, P] = C.useState(null),
      F = () => {
        (k(Q()), S(!0));
      },
      A = (i) => {
        (k(Q(i)), S(!0));
      },
      L = () => {
        y || S(!1);
      },
      T = (i) => (j) => {
        const w = j.target.value;
        k((_) => re(ne({}, _), { [i]: w }));
      },
      q = () =>
        v(void 0, null, function* () {
          var _;
          const i = h.title.trim(),
            j = h.summary.trim(),
            w = h.body.trim();
          if (!i || !j) {
            s({
              title: "Missing required fields",
              description: "Title and summary are required to save content.",
              variant: "warning",
            });
            return;
          }
          try {
            (yield p({
              id: h.id,
              title: i,
              summary: j,
              body: w,
              status: h.status,
            }),
              s({
                title: h.id ? "Content updated" : "Content created",
                variant: "success",
              }),
              S(!1));
          } catch (D) {
            const U = D;
            s({
              title: "Failed to save content",
              description:
                (_ = U == null ? void 0 : U.message) != null
                  ? _
                  : "Something went wrong while saving content.",
              variant: "error",
            });
          }
        }),
      B = () =>
        v(void 0, null, function* () {
          var i;
          try {
            yield d();
          } catch (j) {
            const w = r != null ? r : j;
            s({
              title: "Failed to load content",
              description:
                (i = w == null ? void 0 : w.message) != null
                  ? i
                  : "Something went wrong while fetching content.",
              variant: "error",
            });
          }
        }),
      M = (i) => {
        P(i);
      },
      z = () => {
        P(null);
      },
      l = () =>
        v(void 0, null, function* () {
          var j;
          if (!c) return;
          const i = c.status === "published" ? "draft" : "published";
          try {
            (yield p({ id: c.id, status: i }),
              s({
                title:
                  i === "published"
                    ? "Content published"
                    : "Content unpublished",
                variant: "success",
              }),
              z());
          } catch (w) {
            const _ = w;
            s({
              title: "Failed to update content status",
              description:
                (j = _ == null ? void 0 : _.message) != null
                  ? j
                  : "Something went wrong while updating content.",
              variant: "error",
            });
          }
        }),
      f = C.useMemo(
        () =>
          [...u].sort((i, j) => {
            var D, U;
            const w = (D = i.publishedAt) != null ? D : "";
            return ((U = j.publishedAt) != null ? U : "").localeCompare(w);
          }),
        [u],
      ),
      b = (i) =>
        i === "published"
          ? e.jsx("span", {
              className:
                "inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent",
              children: "Published",
            })
          : e.jsx("span", {
              className:
                "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500",
              children: "Draft",
            }),
      ve = (i) => {
        if (!i) return "—";
        const j = new Date(i);
        return Number.isNaN(j.getTime()) ? i : j.toLocaleDateString();
      };
    return e.jsxs("section", {
      "aria-labelledby": "admin-content-heading",
      className: "space-y-4",
      children: [
        e.jsxs("header", {
          className:
            "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
          children: [
            e.jsxs("div", {
              children: [
                e.jsx("h1", {
                  id: "admin-content-heading",
                  className: "text-lg font-semibold text-gray-900",
                  children: "Content management",
                }),
                e.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "Manage news and articles shown to farmers.",
                }),
              ],
            }),
            e.jsx(x, {
              size: "sm",
              variant: "primary",
              onClick: F,
              children: "New content",
            }),
          ],
        }),
        e.jsxs(g, {
          children: [
            e.jsx("div", {
              className:
                "flex items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3 text-xs text-gray-600",
              children: e.jsx("span", {
                children: m ? "Refreshing content…" : `Total items: ${o}`,
              }),
            }),
            e.jsx("div", {
              className: "overflow-x-auto",
              children: e.jsxs("table", {
                className:
                  "min-w-full divide-y divide-gray-100 text-left text-sm",
                children: [
                  e.jsx("thead", {
                    className: "bg-gray-50",
                    children: e.jsxs("tr", {
                      children: [
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Title",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Summary",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Status",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                          children: "Published",
                        }),
                        e.jsx("th", {
                          scope: "col",
                          className:
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right",
                          children: "Actions",
                        }),
                      ],
                    }),
                  }),
                  e.jsxs("tbody", {
                    className: "divide-y divide-gray-100",
                    children: [
                      a &&
                        e.jsx("tr", {
                          children: e.jsx("td", {
                            colSpan: 5,
                            className:
                              "px-4 py-6 text-center text-sm text-gray-500",
                            children: "Loading content…",
                          }),
                        }),
                      !a &&
                        n &&
                        e.jsx("tr", {
                          children: e.jsx("td", {
                            colSpan: 5,
                            className:
                              "px-4 py-6 text-center text-sm text-red-600",
                            children: e.jsxs("div", {
                              className: "flex flex-col items-center gap-3",
                              children: [
                                e.jsx("p", {
                                  children: "Unable to load content.",
                                }),
                                e.jsx(x, {
                                  size: "sm",
                                  variant: "secondary",
                                  onClick: B,
                                  children: "Retry",
                                }),
                              ],
                            }),
                          }),
                        }),
                      !a &&
                        !n &&
                        f.length === 0 &&
                        e.jsx("tr", {
                          children: e.jsx("td", {
                            colSpan: 5,
                            className:
                              "px-4 py-6 text-center text-sm text-gray-500",
                            children:
                              "No content items yet. Use New content to create the first announcement.",
                          }),
                        }),
                      !a &&
                        !n &&
                        f.map((i) =>
                          e.jsxs(
                            "tr",
                            {
                              className:
                                "hover:bg-gray-50 text-gray-900 align-top",
                              children: [
                                e.jsx("td", {
                                  className: "px-4 py-3 text-sm font-medium",
                                  children: i.title,
                                }),
                                e.jsx("td", {
                                  className:
                                    "px-4 py-3 text-xs text-gray-700 max-w-md",
                                  children: e.jsx("span", {
                                    className: "line-clamp-2",
                                    children: i.summary,
                                  }),
                                }),
                                e.jsx("td", {
                                  className: "px-4 py-3 text-xs",
                                  children: b(i.status),
                                }),
                                e.jsx("td", {
                                  className: "px-4 py-3 text-xs text-gray-600",
                                  children: ve(i.publishedAt),
                                }),
                                e.jsx("td", {
                                  className: "px-4 py-3 text-right",
                                  children: e.jsxs("div", {
                                    className:
                                      "flex flex-wrap justify-end gap-2",
                                    children: [
                                      e.jsx(x, {
                                        size: "sm",
                                        variant: "secondary",
                                        onClick: () => A(i),
                                        children: "Edit",
                                      }),
                                      e.jsx(x, {
                                        size: "sm",
                                        variant: "ghost",
                                        onClick: () => M(i),
                                        children:
                                          i.status === "published"
                                            ? "Unpublish"
                                            : "Publish",
                                      }),
                                    ],
                                  }),
                                }),
                              ],
                            },
                            i.id,
                          ),
                        ),
                    ],
                  }),
                ],
              }),
            }),
          ],
        }),
        e.jsx(V, {
          isOpen: N,
          onClose: L,
          title: h.id ? "Edit content" : "New content",
          children: e.jsxs("div", {
            className: "space-y-4",
            children: [
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsx("label", {
                    htmlFor: "content-title",
                    className: "block text-xs font-medium text-gray-700",
                    children: "Title",
                  }),
                  e.jsx("input", {
                    id: "content-title",
                    type: "text",
                    value: h.title,
                    onChange: T("title"),
                    className:
                      "block w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue",
                    placeholder: "Enter a clear headline",
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsx("label", {
                    htmlFor: "content-summary",
                    className: "block text-xs font-medium text-gray-700",
                    children: "Summary",
                  }),
                  e.jsx("input", {
                    id: "content-summary",
                    type: "text",
                    value: h.summary,
                    onChange: T("summary"),
                    className:
                      "block w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue",
                    placeholder: "Short description shown in lists",
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsx("label", {
                    htmlFor: "content-body",
                    className: "block text-xs font-medium text-gray-700",
                    children: "Body",
                  }),
                  e.jsx("textarea", {
                    id: "content-body",
                    value: h.body,
                    onChange: T("body"),
                    rows: 6,
                    className:
                      "block w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue",
                    placeholder:
                      "Full text (supports simple paragraphs; rich formatting to be added later)",
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsx("label", {
                    htmlFor: "content-status",
                    className: "block text-xs font-medium text-gray-700",
                    children: "Status",
                  }),
                  e.jsxs("select", {
                    id: "content-status",
                    value: h.status,
                    onChange: T("status"),
                    className:
                      "block w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue",
                    children: [
                      e.jsx("option", { value: "draft", children: "Draft" }),
                      e.jsx("option", {
                        value: "published",
                        children: "Published",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "flex justify-end gap-2 pt-2",
                children: [
                  e.jsx(x, {
                    size: "sm",
                    variant: "secondary",
                    onClick: L,
                    disabled: y,
                    children: "Cancel",
                  }),
                  e.jsx(x, {
                    size: "sm",
                    variant: "primary",
                    onClick: q,
                    disabled: y,
                    children: y ? "Saving…" : "Save",
                  }),
                ],
              }),
            ],
          }),
        }),
        e.jsx(V, {
          isOpen: !!c,
          onClose: z,
          title:
            (c == null ? void 0 : c.status) === "published"
              ? "Unpublish content"
              : "Publish content",
          children:
            c &&
            e.jsxs("div", {
              className: "space-y-3",
              children: [
                e.jsxs("p", {
                  className: "text-sm text-gray-700",
                  children: [
                    "You are about to ",
                    c.status === "published" ? "unpublish" : "publish",
                    " ",
                    e.jsx("span", {
                      className: "font-medium",
                      children: c.title,
                    }),
                    ".",
                  ],
                }),
                e.jsx("p", {
                  className: "text-xs text-gray-500",
                  children:
                    "Published items may be visible to farmers in the mobile or web app, depending on configuration.",
                }),
                e.jsxs("div", {
                  className: "flex justify-end gap-2 pt-2",
                  children: [
                    e.jsx(x, {
                      size: "sm",
                      variant: "secondary",
                      onClick: z,
                      disabled: y,
                      children: "Cancel",
                    }),
                    e.jsx(x, {
                      size: "sm",
                      variant: "primary",
                      onClick: l,
                      disabled: y,
                      children: y ? "Updating…" : "Confirm",
                    }),
                  ],
                }),
              ],
            }),
        }),
      ],
    });
  },
  Je = Object.freeze(
    Object.defineProperty(
      { __proto__: null, AdminContentPage: ce, default: ce },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  Y = (s) => {
    switch (s) {
      case "up":
        return "excellent";
      case "degraded":
        return "fair";
      case "down":
        return "poor";
      default:
        return "default";
    }
  },
  W = (s) => {
    switch (s) {
      case "up":
        return "inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent";
      case "degraded":
        return "inline-flex items-center rounded-full bg-status-fair/10 px-2 py-0.5 text-xs font-medium text-status-fair";
      case "down":
        return "inline-flex items-center rounded-full bg-status-poor/10 px-2 py-0.5 text-xs font-medium text-status-poor";
      default:
        return "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500";
    }
  },
  J = (s) => {
    switch (s) {
      case "up":
        return "Up";
      case "degraded":
        return "Degraded";
      case "down":
        return "Down";
      default:
        return "Unknown";
    }
  },
  de = () => {
    var o;
    const { showToast: s } = E(),
      {
        data: t,
        isLoading: a,
        isError: n,
        error: r,
        refetch: d,
        isFetching: m,
      } = be(),
      u = () =>
        v(void 0, null, function* () {
          var p;
          try {
            (yield d(),
              s({ title: "System status refreshed", variant: "success" }));
          } catch (y) {
            const N = r != null ? r : y;
            s({
              title: "Failed to refresh system status",
              description:
                (p = N == null ? void 0 : N.message) != null
                  ? p
                  : "Something went wrong while refreshing system health.",
              variant: "error",
            });
          }
        });
    return e.jsxs("section", {
      "aria-labelledby": "admin-system-health-heading",
      className: "space-y-4",
      children: [
        e.jsxs("header", {
          className:
            "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
          children: [
            e.jsxs("div", {
              className: "space-y-1",
              children: [
                e.jsx("h1", {
                  id: "admin-system-health-heading",
                  className: "text-lg font-semibold text-gray-900",
                  children: "System health",
                }),
                e.jsx("p", {
                  className: "text-sm text-gray-600",
                  children:
                    "Real-time view of API, ML, and satellite ingest status. Use this to understand how SkyCrop services are behaving.",
                }),
              ],
            }),
            e.jsx(x, {
              size: "sm",
              variant: "secondary",
              onClick: u,
              disabled: m,
              children: m ? "Refreshing…" : "Refresh",
            }),
          ],
        }),
        e.jsxs(g, {
          children: [
            a &&
              !t &&
              e.jsx("p", {
                className: "text-sm text-gray-500",
                children: "Checking system status…",
              }),
            n &&
              !t &&
              e.jsxs("div", {
                className: "flex flex-col gap-3 text-sm",
                children: [
                  e.jsxs("p", {
                    className: "text-red-600",
                    children: [
                      "Unable to load system status: ",
                      (o = r == null ? void 0 : r.message) != null
                        ? o
                        : "Unknown error",
                      ".",
                    ],
                  }),
                  e.jsx("div", {
                    className: "flex flex-wrap gap-2",
                    children: e.jsx(x, {
                      size: "sm",
                      variant: "secondary",
                      onClick: u,
                      disabled: m,
                      children: "Retry",
                    }),
                  }),
                ],
              }),
            !a &&
              !n &&
              t &&
              e.jsxs("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                  e.jsx(g, {
                    title: "API",
                    status: Y(t.api),
                    showStatusStripe: !0,
                    className: "border-0 shadow-none",
                    children: e.jsxs("div", {
                      className: "flex flex-col gap-2",
                      children: [
                        e.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            e.jsx("span", {
                              className: "text-xs text-gray-600",
                              children: "Status",
                            }),
                            e.jsx("span", {
                              className: W(t.api),
                              children: J(t.api),
                            }),
                          ],
                        }),
                        e.jsx("p", {
                          className: "text-sm text-gray-700",
                          children:
                            "The API provides all core platform capabilities including authentication, fields, health, and recommendations.",
                        }),
                        t.api === "degraded" &&
                          e.jsx("p", {
                            className: "text-xs text-status-fair",
                            children:
                              "API is degraded. Expect slower responses and occasional timeouts for farmers.",
                          }),
                        t.api === "down" &&
                          e.jsx("p", {
                            className: "text-xs text-status-poor",
                            children:
                              "API is down. Farmers may be unable to sign in or view updated field information.",
                          }),
                      ],
                    }),
                  }),
                  e.jsx(g, {
                    title: "ML service",
                    status: Y(t.mlService),
                    showStatusStripe: !0,
                    className: "border-0 shadow-none",
                    children: e.jsxs("div", {
                      className: "flex flex-col gap-2",
                      children: [
                        e.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            e.jsx("span", {
                              className: "text-xs text-gray-600",
                              children: "Status",
                            }),
                            e.jsx("span", {
                              className: W(t.mlService),
                              children: J(t.mlService),
                            }),
                          ],
                        }),
                        e.jsx("p", {
                          className: "text-sm text-gray-700",
                          children:
                            "ML services power health indices, yield predictions, and recommendation models for farmer fields.",
                        }),
                        t.mlService === "degraded" &&
                          e.jsx("p", {
                            className: "text-xs text-status-fair",
                            children:
                              "ML service is degraded. Health maps and recommendations may take longer to generate.",
                          }),
                        t.mlService === "down" &&
                          e.jsx("p", {
                            className: "text-xs text-status-poor",
                            children:
                              "ML service is down. New health insights or recommendations may not be available and existing ones may be stale.",
                          }),
                      ],
                    }),
                  }),
                  e.jsx(g, {
                    title: "Satellite ingest",
                    status: Y(t.satelliteIngest),
                    showStatusStripe: !0,
                    className: "border-0 shadow-none",
                    children: e.jsxs("div", {
                      className: "flex flex-col gap-2",
                      children: [
                        e.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            e.jsx("span", {
                              className: "text-xs text-gray-600",
                              children: "Status",
                            }),
                            e.jsx("span", {
                              className: W(t.satelliteIngest),
                              children: J(t.satelliteIngest),
                            }),
                          ],
                        }),
                        e.jsx("p", {
                          className: "text-sm text-gray-700",
                          children:
                            "Satellite ingest handles fetching, processing, and storing new imagery used for field monitoring.",
                        }),
                        t.satelliteIngest === "degraded" &&
                          e.jsx("p", {
                            className: "text-xs text-status-fair",
                            children:
                              "Ingest is degraded. Expect delays before new satellite scenes appear in field views.",
                          }),
                        t.satelliteIngest === "down" &&
                          e.jsx("p", {
                            className: "text-xs text-status-poor",
                            children:
                              "Ingest is down. No new imagery will be processed until this is resolved; health data may become outdated.",
                          }),
                      ],
                    }),
                  }),
                ],
              }),
            !a &&
              !n &&
              !t &&
              e.jsx("p", {
                className: "text-sm text-gray-500",
                children: "System status is currently unavailable.",
              }),
          ],
        }),
      ],
    });
  },
  Ve = Object.freeze(
    Object.defineProperty(
      { __proto__: null, AdminSystemHealthPage: de, default: de },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  );
export { Ye as A, We as a, Je as b, Ve as c, e as j };
