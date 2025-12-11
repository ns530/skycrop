var K = (e, t, r) =>
  new Promise((n, a) => {
    var l = (u) => {
        try {
          d(r.next(u));
        } catch (f) {
          a(f);
        }
      },
      o = (u) => {
        try {
          d(r.throw(u));
        } catch (f) {
          a(f);
        }
      },
      d = (u) => (u.done ? n(u.value) : Promise.resolve(u.value).then(l, o));
    d((r = r.apply(e, t)).next());
  });
import { r as g, i as Xr, j as Qr } from "./chart-vendor-C7uCl44m.js";
/**
 * @remix-run/router v1.23.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function V() {
  return (
    (V = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var r = arguments[t];
            for (var n in r)
              Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
          }
          return e;
        }),
    V.apply(this, arguments)
  );
}
var Q;
(function (e) {
  ((e.Pop = "POP"), (e.Push = "PUSH"), (e.Replace = "REPLACE"));
})(Q || (Q = {}));
const Gt = "popstate";
function Zr(e) {
  e === void 0 && (e = {});
  function t(n, a) {
    let { pathname: l, search: o, hash: d } = n.location;
    return qe(
      "",
      { pathname: l, search: o, hash: d },
      (a.state && a.state.usr) || null,
      (a.state && a.state.key) || "default",
    );
  }
  function r(n, a) {
    return typeof a == "string" ? a : Fe(a);
  }
  return en(t, r, null, e);
}
function O(e, t) {
  if (e === !1 || e === null || typeof e == "undefined") throw new Error(t);
}
function Ue(e, t) {
  if (!e) {
    typeof console != "undefined" && console.warn(t);
    try {
      throw new Error(t);
    } catch (r) {}
  }
}
function qr() {
  return Math.random().toString(36).substr(2, 8);
}
function Xt(e, t) {
  return { usr: e.state, key: e.key, idx: t };
}
function qe(e, t, r, n) {
  return (
    r === void 0 && (r = null),
    V(
      { pathname: typeof e == "string" ? e : e.pathname, search: "", hash: "" },
      typeof t == "string" ? Ee(t) : t,
      { state: r, key: (t && t.key) || n || qr() },
    )
  );
}
function Fe(e) {
  let { pathname: t = "/", search: r = "", hash: n = "" } = e;
  return (
    r && r !== "?" && (t += r.charAt(0) === "?" ? r : "?" + r),
    n && n !== "#" && (t += n.charAt(0) === "#" ? n : "#" + n),
    t
  );
}
function Ee(e) {
  let t = {};
  if (e) {
    let r = e.indexOf("#");
    r >= 0 && ((t.hash = e.substr(r)), (e = e.substr(0, r)));
    let n = e.indexOf("?");
    (n >= 0 && ((t.search = e.substr(n)), (e = e.substr(0, n))),
      e && (t.pathname = e));
  }
  return t;
}
function en(e, t, r, n) {
  n === void 0 && (n = {});
  let { window: a = document.defaultView, v5Compat: l = !1 } = n,
    o = a.history,
    d = Q.Pop,
    u = null,
    f = p();
  f == null && ((f = 0), o.replaceState(V({}, o.state, { idx: f }), ""));
  function p() {
    return (o.state || { idx: null }).idx;
  }
  function h() {
    d = Q.Pop;
    let M = p(),
      I = M == null ? null : M - f;
    ((f = M), u && u({ action: d, location: R.location, delta: I }));
  }
  function y(M, I) {
    d = Q.Push;
    let L = qe(R.location, M, I);
    f = p() + 1;
    let N = Xt(L, f),
      A = R.createHref(L);
    try {
      o.pushState(N, "", A);
    } catch ($) {
      if ($ instanceof DOMException && $.name === "DataCloneError") throw $;
      a.location.assign(A);
    }
    l && u && u({ action: d, location: R.location, delta: 1 });
  }
  function w(M, I) {
    d = Q.Replace;
    let L = qe(R.location, M, I);
    f = p();
    let N = Xt(L, f),
      A = R.createHref(L);
    (o.replaceState(N, "", A),
      l && u && u({ action: d, location: R.location, delta: 0 }));
  }
  function S(M) {
    let I = a.location.origin !== "null" ? a.location.origin : a.location.href,
      L = typeof M == "string" ? M : Fe(M);
    return (
      (L = L.replace(/ $/, "%20")),
      O(
        I,
        "No window.location.(origin|href) available to create URL for href: " +
          L,
      ),
      new URL(L, I)
    );
  }
  let R = {
    get action() {
      return d;
    },
    get location() {
      return e(a, o);
    },
    listen(M) {
      if (u) throw new Error("A history only accepts one active listener");
      return (
        a.addEventListener(Gt, h),
        (u = M),
        () => {
          (a.removeEventListener(Gt, h), (u = null));
        }
      );
    },
    createHref(M) {
      return t(a, M);
    },
    createURL: S,
    encodeLocation(M) {
      let I = S(M);
      return { pathname: I.pathname, search: I.search, hash: I.hash };
    },
    push: y,
    replace: w,
    go(M) {
      return o.go(M);
    },
  };
  return R;
}
var k;
(function (e) {
  ((e.data = "data"),
    (e.deferred = "deferred"),
    (e.redirect = "redirect"),
    (e.error = "error"));
})(k || (k = {}));
const tn = new Set([
  "lazy",
  "caseSensitive",
  "path",
  "id",
  "index",
  "children",
]);
function rn(e) {
  return e.index === !0;
}
function mt(e, t, r, n) {
  return (
    r === void 0 && (r = []),
    n === void 0 && (n = {}),
    e.map((a, l) => {
      let o = [...r, String(l)],
        d = typeof a.id == "string" ? a.id : o.join("-");
      if (
        (O(
          a.index !== !0 || !a.children,
          "Cannot specify children on an index route",
        ),
        O(
          !n[d],
          'Found a route id collision on id "' +
            d +
            `".  Route id's must be globally unique within Data Router usages`,
        ),
        rn(a))
      ) {
        let u = V({}, a, t(a), { id: d });
        return ((n[d] = u), u);
      } else {
        let u = V({}, a, t(a), { id: d, children: void 0 });
        return (
          (n[d] = u),
          a.children && (u.children = mt(a.children, t, o, n)),
          u
        );
      }
    })
  );
}
function De(e, t, r) {
  return (r === void 0 && (r = "/"), ht(e, t, r, !1));
}
function ht(e, t, r, n) {
  let a = typeof t == "string" ? Ee(t) : t,
    l = ve(a.pathname || "/", r);
  if (l == null) return null;
  let o = vr(e);
  an(o);
  let d = null;
  for (let u = 0; d == null && u < o.length; ++u) {
    let f = vn(l);
    d = mn(o[u], f, n);
  }
  return d;
}
function nn(e, t) {
  let { route: r, pathname: n, params: a } = e;
  return { id: r.id, pathname: n, params: a, data: t[r.id], handle: r.handle };
}
function vr(e, t, r, n) {
  (t === void 0 && (t = []),
    r === void 0 && (r = []),
    n === void 0 && (n = ""));
  let a = (l, o, d) => {
    let u = {
      relativePath: d === void 0 ? l.path || "" : d,
      caseSensitive: l.caseSensitive === !0,
      childrenIndex: o,
      route: l,
    };
    u.relativePath.startsWith("/") &&
      (O(
        u.relativePath.startsWith(n),
        'Absolute route path "' +
          u.relativePath +
          '" nested under path ' +
          ('"' + n + '" is not valid. An absolute child route path ') +
          "must start with the combined path of all its parent routes.",
      ),
      (u.relativePath = u.relativePath.slice(n.length)));
    let f = pe([n, u.relativePath]),
      p = r.concat(u);
    (l.children &&
      l.children.length > 0 &&
      (O(
        l.index !== !0,
        "Index routes must not have child routes. Please remove " +
          ('all child routes from route path "' + f + '".'),
      ),
      vr(l.children, t, p, f)),
      !(l.path == null && !l.index) &&
        t.push({ path: f, score: fn(f, l.index), routesMeta: p }));
  };
  return (
    e.forEach((l, o) => {
      var d;
      if (l.path === "" || !((d = l.path) != null && d.includes("?"))) a(l, o);
      else for (let u of gr(l.path)) a(l, o, u);
    }),
    t
  );
}
function gr(e) {
  let t = e.split("/");
  if (t.length === 0) return [];
  let [r, ...n] = t,
    a = r.endsWith("?"),
    l = r.replace(/\?$/, "");
  if (n.length === 0) return a ? [l, ""] : [l];
  let o = gr(n.join("/")),
    d = [];
  return (
    d.push(...o.map((u) => (u === "" ? l : [l, u].join("/")))),
    a && d.push(...o),
    d.map((u) => (e.startsWith("/") && u === "" ? "/" : u))
  );
}
function an(e) {
  e.sort((t, r) =>
    t.score !== r.score
      ? r.score - t.score
      : hn(
          t.routesMeta.map((n) => n.childrenIndex),
          r.routesMeta.map((n) => n.childrenIndex),
        ),
  );
}
const on = /^:[\w-]+$/,
  ln = 3,
  sn = 2,
  un = 1,
  dn = 10,
  cn = -2,
  Qt = (e) => e === "*";
function fn(e, t) {
  let r = e.split("/"),
    n = r.length;
  return (
    r.some(Qt) && (n += cn),
    t && (n += sn),
    r
      .filter((a) => !Qt(a))
      .reduce((a, l) => a + (on.test(l) ? ln : l === "" ? un : dn), n)
  );
}
function hn(e, t) {
  return e.length === t.length && e.slice(0, -1).every((n, a) => n === t[a])
    ? e[e.length - 1] - t[t.length - 1]
    : 0;
}
function mn(e, t, r) {
  r === void 0 && (r = !1);
  let { routesMeta: n } = e,
    a = {},
    l = "/",
    o = [];
  for (let d = 0; d < n.length; ++d) {
    let u = n[d],
      f = d === n.length - 1,
      p = l === "/" ? t : t.slice(l.length) || "/",
      h = pt(
        { path: u.relativePath, caseSensitive: u.caseSensitive, end: f },
        p,
      ),
      y = u.route;
    if (
      (!h &&
        f &&
        r &&
        !n[n.length - 1].route.index &&
        (h = pt(
          { path: u.relativePath, caseSensitive: u.caseSensitive, end: !1 },
          p,
        )),
      !h)
    )
      return null;
    (Object.assign(a, h.params),
      o.push({
        params: a,
        pathname: pe([l, h.pathname]),
        pathnameBase: bn(pe([l, h.pathnameBase])),
        route: y,
      }),
      h.pathnameBase !== "/" && (l = pe([l, h.pathnameBase])));
  }
  return o;
}
function pt(e, t) {
  typeof e == "string" && (e = { path: e, caseSensitive: !1, end: !0 });
  let [r, n] = pn(e.path, e.caseSensitive, e.end),
    a = t.match(r);
  if (!a) return null;
  let l = a[0],
    o = l.replace(/(.)\/+$/, "$1"),
    d = a.slice(1);
  return {
    params: n.reduce((f, p, h) => {
      let { paramName: y, isOptional: w } = p;
      if (y === "*") {
        let R = d[h] || "";
        o = l.slice(0, l.length - R.length).replace(/(.)\/+$/, "$1");
      }
      const S = d[h];
      return (
        w && !S ? (f[y] = void 0) : (f[y] = (S || "").replace(/%2F/g, "/")),
        f
      );
    }, {}),
    pathname: l,
    pathnameBase: o,
    pattern: e,
  };
}
function pn(e, t, r) {
  (t === void 0 && (t = !1),
    r === void 0 && (r = !0),
    Ue(
      e === "*" || !e.endsWith("*") || e.endsWith("/*"),
      'Route path "' +
        e +
        '" will be treated as if it were ' +
        ('"' + e.replace(/\*$/, "/*") + '" because the `*` character must ') +
        "always follow a `/` in the pattern. To get rid of this warning, " +
        ('please change the route path to "' + e.replace(/\*$/, "/*") + '".'),
    ));
  let n = [],
    a =
      "^" +
      e
        .replace(/\/*\*?$/, "")
        .replace(/^\/*/, "/")
        .replace(/[\\.*+^${}|()[\]]/g, "\\$&")
        .replace(
          /\/:([\w-]+)(\?)?/g,
          (o, d, u) => (
            n.push({ paramName: d, isOptional: u != null }),
            u ? "/?([^\\/]+)?" : "/([^\\/]+)"
          ),
        );
  return (
    e.endsWith("*")
      ? (n.push({ paramName: "*" }),
        (a += e === "*" || e === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$"))
      : r
        ? (a += "\\/*$")
        : e !== "" && e !== "/" && (a += "(?:(?=\\/|$))"),
    [new RegExp(a, t ? void 0 : "i"), n]
  );
}
function vn(e) {
  try {
    return e
      .split("/")
      .map((t) => decodeURIComponent(t).replace(/\//g, "%2F"))
      .join("/");
  } catch (t) {
    return (
      Ue(
        !1,
        'The URL path "' +
          e +
          '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' +
          ("encoding (" + t + ")."),
      ),
      e
    );
  }
}
function ve(e, t) {
  if (t === "/") return e;
  if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
  let r = t.endsWith("/") ? t.length - 1 : t.length,
    n = e.charAt(r);
  return n && n !== "/" ? null : e.slice(r) || "/";
}
const gn = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  yn = (e) => gn.test(e);
function wn(e, t) {
  t === void 0 && (t = "/");
  let {
      pathname: r,
      search: n = "",
      hash: a = "",
    } = typeof e == "string" ? Ee(e) : e,
    l;
  if (r)
    if (yn(r)) l = r;
    else {
      if (r.includes("//")) {
        let o = r;
        ((r = r.replace(/\/\/+/g, "/")),
          Ue(
            !1,
            "Pathnames cannot have embedded double slashes - normalizing " +
              (o + " -> " + r),
          ));
      }
      r.startsWith("/") ? (l = Zt(r.substring(1), "/")) : (l = Zt(r, t));
    }
  else l = t;
  return { pathname: l, search: Rn(n), hash: En(a) };
}
function Zt(e, t) {
  let r = t.replace(/\/+$/, "").split("/");
  return (
    e.split("/").forEach((a) => {
      a === ".." ? r.length > 1 && r.pop() : a !== "." && r.push(a);
    }),
    r.length > 1 ? r.join("/") : "/"
  );
}
function Pt(e, t, r, n) {
  return (
    "Cannot include a '" +
    e +
    "' character in a manually specified " +
    ("`to." +
      t +
      "` field [" +
      JSON.stringify(n) +
      "].  Please separate it out to the ") +
    ("`to." + r + "` field. Alternatively you may provide the full path as ") +
    'a string in <Link to="..."> and the router will parse it for you.'
  );
}
function yr(e) {
  return e.filter(
    (t, r) => r === 0 || (t.route.path && t.route.path.length > 0),
  );
}
function yt(e, t) {
  let r = yr(e);
  return t
    ? r.map((n, a) => (a === r.length - 1 ? n.pathname : n.pathnameBase))
    : r.map((n) => n.pathnameBase);
}
function wt(e, t, r, n) {
  n === void 0 && (n = !1);
  let a;
  typeof e == "string"
    ? (a = Ee(e))
    : ((a = V({}, e)),
      O(
        !a.pathname || !a.pathname.includes("?"),
        Pt("?", "pathname", "search", a),
      ),
      O(
        !a.pathname || !a.pathname.includes("#"),
        Pt("#", "pathname", "hash", a),
      ),
      O(!a.search || !a.search.includes("#"), Pt("#", "search", "hash", a)));
  let l = e === "" || a.pathname === "",
    o = l ? "/" : a.pathname,
    d;
  if (o == null) d = r;
  else {
    let h = t.length - 1;
    if (!n && o.startsWith("..")) {
      let y = o.split("/");
      for (; y[0] === ".."; ) (y.shift(), (h -= 1));
      a.pathname = y.join("/");
    }
    d = h >= 0 ? t[h] : "/";
  }
  let u = wn(a, d),
    f = o && o !== "/" && o.endsWith("/"),
    p = (l || o === ".") && r.endsWith("/");
  return (!u.pathname.endsWith("/") && (f || p) && (u.pathname += "/"), u);
}
const pe = (e) => e.join("/").replace(/\/\/+/g, "/"),
  bn = (e) => e.replace(/\/+$/, "").replace(/^\/*/, "/"),
  Rn = (e) => (!e || e === "?" ? "" : e.startsWith("?") ? e : "?" + e),
  En = (e) => (!e || e === "#" ? "" : e.startsWith("#") ? e : "#" + e);
class vt {
  constructor(t, r, n, a) {
    (a === void 0 && (a = !1),
      (this.status = t),
      (this.statusText = r || ""),
      (this.internal = a),
      n instanceof Error
        ? ((this.data = n.toString()), (this.error = n))
        : (this.data = n));
  }
}
function et(e) {
  return (
    e != null &&
    typeof e.status == "number" &&
    typeof e.statusText == "string" &&
    typeof e.internal == "boolean" &&
    "data" in e
  );
}
const wr = ["post", "put", "patch", "delete"],
  xn = new Set(wr),
  Sn = ["get", ...wr],
  Pn = new Set(Sn),
  Ln = new Set([301, 302, 303, 307, 308]),
  Cn = new Set([307, 308]),
  Lt = {
    state: "idle",
    location: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  Dn = {
    state: "idle",
    data: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  Ge = { state: "unblocked", proceed: void 0, reset: void 0, location: void 0 },
  Ft = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  Mn = (e) => ({ hasErrorBoundary: !!e.hasErrorBoundary }),
  br = "remix-router-transitions";
function Tn(e) {
  const t = e.window
      ? e.window
      : typeof window != "undefined"
        ? window
        : void 0,
    r =
      typeof t != "undefined" &&
      typeof t.document != "undefined" &&
      typeof t.document.createElement != "undefined",
    n = !r;
  O(
    e.routes.length > 0,
    "You must provide a non-empty routes array to createRouter",
  );
  let a;
  if (e.mapRouteProperties) a = e.mapRouteProperties;
  else if (e.detectErrorBoundary) {
    let i = e.detectErrorBoundary;
    a = (s) => ({ hasErrorBoundary: i(s) });
  } else a = Mn;
  let l = {},
    o = mt(e.routes, a, void 0, l),
    d,
    u = e.basename || "/",
    f = e.dataStrategy || On,
    p = e.patchRoutesOnNavigation,
    h = V(
      {
        v7_fetcherPersist: !1,
        v7_normalizeFormMethod: !1,
        v7_partialHydration: !1,
        v7_prependBasename: !1,
        v7_relativeSplatPath: !1,
        v7_skipActionErrorRevalidation: !1,
      },
      e.future,
    ),
    y = null,
    w = new Set(),
    S = null,
    R = null,
    M = null,
    I = e.hydrationData != null,
    L = De(o, e.history.location, u),
    N = !1,
    A = null;
  if (L == null && !p) {
    let i = ne(404, { pathname: e.history.location.pathname }),
      { matches: s, route: c } = ur(o);
    ((L = s), (A = { [c.id]: i }));
  }
  L &&
    !e.hydrationData &&
    st(L, o, e.history.location.pathname).active &&
    (L = null);
  let $;
  if (L)
    if (L.some((i) => i.route.lazy)) $ = !1;
    else if (!L.some((i) => i.route.loader)) $ = !0;
    else if (h.v7_partialHydration) {
      let i = e.hydrationData ? e.hydrationData.loaderData : null,
        s = e.hydrationData ? e.hydrationData.errors : null;
      if (s) {
        let c = L.findIndex((v) => s[v.route.id] !== void 0);
        $ = L.slice(0, c + 1).every((v) => !Mt(v.route, i, s));
      } else $ = L.every((c) => !Mt(c.route, i, s));
    } else $ = e.hydrationData != null;
  else if ((($ = !1), (L = []), h.v7_partialHydration)) {
    let i = st(null, o, e.history.location.pathname);
    i.active && i.matches && ((N = !0), (L = i.matches));
  }
  let oe,
    m = {
      historyAction: e.history.action,
      location: e.history.location,
      matches: L,
      initialized: $,
      navigation: Lt,
      restoreScrollPosition: e.hydrationData != null ? !1 : null,
      preventScrollReset: !1,
      revalidation: "idle",
      loaderData: (e.hydrationData && e.hydrationData.loaderData) || {},
      actionData: (e.hydrationData && e.hydrationData.actionData) || null,
      errors: (e.hydrationData && e.hydrationData.errors) || A,
      fetchers: new Map(),
      blockers: new Map(),
    },
    T = Q.Pop,
    H = !1,
    _,
    Z = !1,
    G = new Map(),
    ae = null,
    re = !1,
    ce = !1,
    rt = [],
    nt = new Set(),
    q = new Map(),
    at = 0,
    We = -1,
    _e = new Map(),
    fe = new Set(),
    Oe = new Map(),
    Ve = new Map(),
    le = new Set(),
    xe = new Map(),
    Se = new Map(),
    it;
  function _r() {
    if (
      ((y = e.history.listen((i) => {
        let { action: s, location: c, delta: v } = i;
        if (it) {
          (it(), (it = void 0));
          return;
        }
        Ue(
          Se.size === 0 || v != null,
          "You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL.",
        );
        let b = $t({
          currentLocation: m.location,
          nextLocation: c,
          historyAction: s,
        });
        if (b && v != null) {
          let D = new Promise((U) => {
            it = U;
          });
          (e.history.go(v * -1),
            lt(b, {
              state: "blocked",
              location: c,
              proceed() {
                (lt(b, {
                  state: "proceeding",
                  proceed: void 0,
                  reset: void 0,
                  location: c,
                }),
                  D.then(() => e.history.go(v)));
              },
              reset() {
                let U = new Map(m.blockers);
                (U.set(b, Ge), te({ blockers: U }));
              },
            }));
          return;
        }
        return Pe(s, c);
      })),
      r)
    ) {
      Yn(t, G);
      let i = () => Gn(t, G);
      (t.addEventListener("pagehide", i),
        (ae = () => t.removeEventListener("pagehide", i)));
    }
    return (
      m.initialized || Pe(Q.Pop, m.location, { initialHydration: !0 }),
      oe
    );
  }
  function Or() {
    (y && y(),
      ae && ae(),
      w.clear(),
      _ && _.abort(),
      m.fetchers.forEach((i, s) => ot(s)),
      m.blockers.forEach((i, s) => Vt(s)));
  }
  function Nr(i) {
    return (w.add(i), () => w.delete(i));
  }
  function te(i, s) {
    (s === void 0 && (s = {}), (m = V({}, m, i)));
    let c = [],
      v = [];
    (h.v7_fetcherPersist &&
      m.fetchers.forEach((b, D) => {
        b.state === "idle" && (le.has(D) ? v.push(D) : c.push(D));
      }),
      le.forEach((b) => {
        !m.fetchers.has(b) && !q.has(b) && v.push(b);
      }),
      [...w].forEach((b) =>
        b(m, {
          deletedFetchers: v,
          viewTransitionOpts: s.viewTransitionOpts,
          flushSync: s.flushSync === !0,
        }),
      ),
      h.v7_fetcherPersist
        ? (c.forEach((b) => m.fetchers.delete(b)), v.forEach((b) => ot(b)))
        : v.forEach((b) => le.delete(b)));
  }
  function Ne(i, s, c) {
    var v, b;
    let { flushSync: D } = c === void 0 ? {} : c,
      U =
        m.actionData != null &&
        m.navigation.formMethod != null &&
        se(m.navigation.formMethod) &&
        m.navigation.state === "loading" &&
        ((v = i.state) == null ? void 0 : v._isRedirect) !== !0,
      x;
    s.actionData
      ? Object.keys(s.actionData).length > 0
        ? (x = s.actionData)
        : (x = null)
      : U
        ? (x = m.actionData)
        : (x = null);
    let P = s.loaderData
        ? lr(m.loaderData, s.loaderData, s.matches || [], s.errors)
        : m.loaderData,
      E = m.blockers;
    E.size > 0 && ((E = new Map(E)), E.forEach((j, ee) => E.set(ee, Ge)));
    let C =
      H === !0 ||
      (m.navigation.formMethod != null &&
        se(m.navigation.formMethod) &&
        ((b = i.state) == null ? void 0 : b._isRedirect) !== !0);
    (d && ((o = d), (d = void 0)),
      re ||
        T === Q.Pop ||
        (T === Q.Push
          ? e.history.push(i, i.state)
          : T === Q.Replace && e.history.replace(i, i.state)));
    let F;
    if (T === Q.Pop) {
      let j = G.get(m.location.pathname);
      j && j.has(i.pathname)
        ? (F = { currentLocation: m.location, nextLocation: i })
        : G.has(i.pathname) &&
          (F = { currentLocation: i, nextLocation: m.location });
    } else if (Z) {
      let j = G.get(m.location.pathname);
      (j
        ? j.add(i.pathname)
        : ((j = new Set([i.pathname])), G.set(m.location.pathname, j)),
        (F = { currentLocation: m.location, nextLocation: i }));
    }
    (te(
      V({}, s, {
        actionData: x,
        loaderData: P,
        historyAction: T,
        location: i,
        initialized: !0,
        navigation: Lt,
        revalidation: "idle",
        restoreScrollPosition: Jt(i, s.matches || m.matches),
        preventScrollReset: C,
        blockers: E,
      }),
      { viewTransitionOpts: F, flushSync: D === !0 },
    ),
      (T = Q.Pop),
      (H = !1),
      (Z = !1),
      (re = !1),
      (ce = !1),
      (rt = []));
  }
  function It(i, s) {
    return K(this, null, function* () {
      if (typeof i == "number") {
        e.history.go(i);
        return;
      }
      let c = Dt(
          m.location,
          m.matches,
          u,
          h.v7_prependBasename,
          i,
          h.v7_relativeSplatPath,
          s == null ? void 0 : s.fromRouteId,
          s == null ? void 0 : s.relative,
        ),
        {
          path: v,
          submission: b,
          error: D,
        } = qt(h.v7_normalizeFormMethod, !1, c, s),
        U = m.location,
        x = qe(m.location, v, s && s.state);
      x = V({}, x, e.history.encodeLocation(x));
      let P = s && s.replace != null ? s.replace : void 0,
        E = Q.Push;
      P === !0
        ? (E = Q.Replace)
        : P === !1 ||
          (b != null &&
            se(b.formMethod) &&
            b.formAction === m.location.pathname + m.location.search &&
            (E = Q.Replace));
      let C =
          s && "preventScrollReset" in s ? s.preventScrollReset === !0 : void 0,
        F = (s && s.flushSync) === !0,
        j = $t({ currentLocation: U, nextLocation: x, historyAction: E });
      if (j) {
        lt(j, {
          state: "blocked",
          location: x,
          proceed() {
            (lt(j, {
              state: "proceeding",
              proceed: void 0,
              reset: void 0,
              location: x,
            }),
              It(i, s));
          },
          reset() {
            let ee = new Map(m.blockers);
            (ee.set(j, Ge), te({ blockers: ee }));
          },
        });
        return;
      }
      return yield Pe(E, x, {
        submission: b,
        pendingError: D,
        preventScrollReset: C,
        replace: s && s.replace,
        enableViewTransition: s && s.viewTransition,
        flushSync: F,
      });
    });
  }
  function jr() {
    if (
      (Rt(),
      te({ revalidation: "loading" }),
      m.navigation.state !== "submitting")
    ) {
      if (m.navigation.state === "idle") {
        Pe(m.historyAction, m.location, { startUninterruptedRevalidation: !0 });
        return;
      }
      Pe(T || m.historyAction, m.navigation.location, {
        overrideNavigation: m.navigation,
        enableViewTransition: Z === !0,
      });
    }
  }
  function Pe(i, s, c) {
    return K(this, null, function* () {
      (_ && _.abort(),
        (_ = null),
        (T = i),
        (re = (c && c.startUninterruptedRevalidation) === !0),
        Kr(m.location, m.matches),
        (H = (c && c.preventScrollReset) === !0),
        (Z = (c && c.enableViewTransition) === !0));
      let v = d || o,
        b = c && c.overrideNavigation,
        D =
          c != null &&
          c.initialHydration &&
          m.matches &&
          m.matches.length > 0 &&
          !N
            ? m.matches
            : De(v, s, u),
        U = (c && c.flushSync) === !0;
      if (
        D &&
        m.initialized &&
        !ce &&
        zn(m.location, s) &&
        !(c && c.submission && se(c.submission.formMethod))
      ) {
        Ne(s, { matches: D }, { flushSync: U });
        return;
      }
      let x = st(D, v, s.pathname);
      if ((x.active && x.matches && (D = x.matches), !D)) {
        let { error: W, notFoundMatches: z, route: J } = Et(s.pathname);
        Ne(
          s,
          { matches: z, loaderData: {}, errors: { [J.id]: W } },
          { flushSync: U },
        );
        return;
      }
      _ = new AbortController();
      let P = Be(e.history, s, _.signal, c && c.submission),
        E;
      if (c && c.pendingError)
        E = [Me(D).route.id, { type: k.error, error: c.pendingError }];
      else if (c && c.submission && se(c.submission.formMethod)) {
        let W = yield Ir(P, s, c.submission, D, x.active, {
          replace: c.replace,
          flushSync: U,
        });
        if (W.shortCircuited) return;
        if (W.pendingActionResult) {
          let [z, J] = W.pendingActionResult;
          if (ie(J) && et(J.error) && J.error.status === 404) {
            ((_ = null),
              Ne(s, {
                matches: W.matches,
                loaderData: {},
                errors: { [z]: J.error },
              }));
            return;
          }
        }
        ((D = W.matches || D),
          (E = W.pendingActionResult),
          (b = Ct(s, c.submission)),
          (U = !1),
          (x.active = !1),
          (P = Be(e.history, P.url, P.signal)));
      }
      let {
        shortCircuited: C,
        matches: F,
        loaderData: j,
        errors: ee,
      } = yield Ar(
        P,
        s,
        D,
        x.active,
        b,
        c && c.submission,
        c && c.fetcherSubmission,
        c && c.replace,
        c && c.initialHydration === !0,
        U,
        E,
      );
      C ||
        ((_ = null),
        Ne(s, V({ matches: F || D }, sr(E), { loaderData: j, errors: ee })));
    });
  }
  function Ir(i, s, c, v, b, D) {
    return K(this, null, function* () {
      (D === void 0 && (D = {}), Rt());
      let U = Kn(s, c);
      if ((te({ navigation: U }, { flushSync: D.flushSync === !0 }), b)) {
        let E = yield ut(v, s.pathname, i.signal);
        if (E.type === "aborted") return { shortCircuited: !0 };
        if (E.type === "error") {
          let C = Me(E.partialMatches).route.id;
          return {
            matches: E.partialMatches,
            pendingActionResult: [C, { type: k.error, error: E.error }],
          };
        } else if (E.matches) v = E.matches;
        else {
          let { notFoundMatches: C, error: F, route: j } = Et(s.pathname);
          return {
            matches: C,
            pendingActionResult: [j.id, { type: k.error, error: F }],
          };
        }
      }
      let x,
        P = Ze(v, s);
      if (!P.route.action && !P.route.lazy)
        x = {
          type: k.error,
          error: ne(405, {
            method: i.method,
            pathname: s.pathname,
            routeId: P.route.id,
          }),
        };
      else if (
        ((x = (yield $e("action", m, i, [P], v, null))[P.route.id]),
        i.signal.aborted)
      )
        return { shortCircuited: !0 };
      if (Te(x)) {
        let E;
        return (
          D && D.replace != null
            ? (E = D.replace)
            : (E =
                ar(x.response.headers.get("Location"), new URL(i.url), u) ===
                m.location.pathname + m.location.search),
          yield Le(i, x, !0, { submission: c, replace: E }),
          { shortCircuited: !0 }
        );
      }
      if (Re(x)) throw ne(400, { type: "defer-action" });
      if (ie(x)) {
        let E = Me(v, P.route.id);
        return (
          (D && D.replace) !== !0 && (T = Q.Push),
          { matches: v, pendingActionResult: [E.route.id, x] }
        );
      }
      return { matches: v, pendingActionResult: [P.route.id, x] };
    });
  }
  function Ar(i, s, c, v, b, D, U, x, P, E, C) {
    return K(this, null, function* () {
      let F = b || Ct(s, D),
        j = D || U || cr(F),
        ee = !re && (!h.v7_partialHydration || !P);
      if (v) {
        if (ee) {
          let Y = At(C);
          te(V({ navigation: F }, Y !== void 0 ? { actionData: Y } : {}), {
            flushSync: E,
          });
        }
        let B = yield ut(c, s.pathname, i.signal);
        if (B.type === "aborted") return { shortCircuited: !0 };
        if (B.type === "error") {
          let Y = Me(B.partialMatches).route.id;
          return {
            matches: B.partialMatches,
            loaderData: {},
            errors: { [Y]: B.error },
          };
        } else if (B.matches) c = B.matches;
        else {
          let { error: Y, notFoundMatches: Ie, route: Ye } = Et(s.pathname);
          return { matches: Ie, loaderData: {}, errors: { [Ye.id]: Y } };
        }
      }
      let W = d || o,
        [z, J] = tr(
          e.history,
          m,
          c,
          j,
          s,
          h.v7_partialHydration && P === !0,
          h.v7_skipActionErrorRevalidation,
          ce,
          rt,
          nt,
          le,
          Oe,
          fe,
          W,
          u,
          C,
        );
      if (
        (xt(
          (B) =>
            !(c && c.some((Y) => Y.route.id === B)) ||
            (z && z.some((Y) => Y.route.id === B)),
        ),
        (We = ++at),
        z.length === 0 && J.length === 0)
      ) {
        let B = Ht();
        return (
          Ne(
            s,
            V(
              {
                matches: c,
                loaderData: {},
                errors: C && ie(C[1]) ? { [C[0]]: C[1].error } : null,
              },
              sr(C),
              B ? { fetchers: new Map(m.fetchers) } : {},
            ),
            { flushSync: E },
          ),
          { shortCircuited: !0 }
        );
      }
      if (ee) {
        let B = {};
        if (!v) {
          B.navigation = F;
          let Y = At(C);
          Y !== void 0 && (B.actionData = Y);
        }
        (J.length > 0 && (B.fetchers = Br(J)), te(B, { flushSync: E }));
      }
      J.forEach((B) => {
        (we(B.key), B.controller && q.set(B.key, B.controller));
      });
      let je = () => J.forEach((B) => we(B.key));
      _ && _.signal.addEventListener("abort", je);
      let { loaderResults: Ke, fetcherResults: me } = yield Bt(m, c, z, J, i);
      if (i.signal.aborted) return { shortCircuited: !0 };
      (_ && _.signal.removeEventListener("abort", je),
        J.forEach((B) => q.delete(B.key)));
      let ue = ft(Ke);
      if (ue)
        return (
          yield Le(i, ue.result, !0, { replace: x }),
          { shortCircuited: !0 }
        );
      if (((ue = ft(me)), ue))
        return (
          fe.add(ue.key),
          yield Le(i, ue.result, !0, { replace: x }),
          { shortCircuited: !0 }
        );
      let { loaderData: St, errors: Je } = or(m, c, Ke, C, J, me, xe);
      (xe.forEach((B, Y) => {
        B.subscribe((Ie) => {
          (Ie || B.done) && xe.delete(Y);
        });
      }),
        h.v7_partialHydration && P && m.errors && (Je = V({}, m.errors, Je)));
      let Ce = Ht(),
        dt = Wt(We),
        ct = Ce || dt || J.length > 0;
      return V(
        { matches: c, loaderData: St, errors: Je },
        ct ? { fetchers: new Map(m.fetchers) } : {},
      );
    });
  }
  function At(i) {
    if (i && !ie(i[1])) return { [i[0]]: i[1].data };
    if (m.actionData)
      return Object.keys(m.actionData).length === 0 ? null : m.actionData;
  }
  function Br(i) {
    return (
      i.forEach((s) => {
        let c = m.fetchers.get(s.key),
          v = Xe(void 0, c ? c.data : void 0);
        m.fetchers.set(s.key, v);
      }),
      new Map(m.fetchers)
    );
  }
  function zr(i, s, c, v) {
    if (n)
      throw new Error(
        "router.fetch() was called during the server render, but it shouldn't be. You are likely calling a useFetcher() method in the body of your component. Try moving it to a useEffect or a callback.",
      );
    we(i);
    let b = (v && v.flushSync) === !0,
      D = d || o,
      U = Dt(
        m.location,
        m.matches,
        u,
        h.v7_prependBasename,
        c,
        h.v7_relativeSplatPath,
        s,
        v == null ? void 0 : v.relative,
      ),
      x = De(D, U, u),
      P = st(x, D, U);
    if ((P.active && P.matches && (x = P.matches), !x)) {
      he(i, s, ne(404, { pathname: U }), { flushSync: b });
      return;
    }
    let {
      path: E,
      submission: C,
      error: F,
    } = qt(h.v7_normalizeFormMethod, !0, U, v);
    if (F) {
      he(i, s, F, { flushSync: b });
      return;
    }
    let j = Ze(x, E),
      ee = (v && v.preventScrollReset) === !0;
    if (C && se(C.formMethod)) {
      kr(i, s, E, j, x, P.active, b, ee, C);
      return;
    }
    (Oe.set(i, { routeId: s, path: E }), Hr(i, s, E, j, x, P.active, b, ee, C));
  }
  function kr(i, s, c, v, b, D, U, x, P) {
    return K(this, null, function* () {
      (Rt(), Oe.delete(i));
      function E(X) {
        if (!X.route.action && !X.route.lazy) {
          let Ae = ne(405, { method: P.formMethod, pathname: c, routeId: s });
          return (he(i, s, Ae, { flushSync: U }), !0);
        }
        return !1;
      }
      if (!D && E(v)) return;
      let C = m.fetchers.get(i);
      ye(i, Jn(P, C), { flushSync: U });
      let F = new AbortController(),
        j = Be(e.history, c, F.signal, P);
      if (D) {
        let X = yield ut(b, new URL(j.url).pathname, j.signal, i);
        if (X.type === "aborted") return;
        if (X.type === "error") {
          he(i, s, X.error, { flushSync: U });
          return;
        } else if (X.matches) {
          if (((b = X.matches), (v = Ze(b, c)), E(v))) return;
        } else {
          he(i, s, ne(404, { pathname: c }), { flushSync: U });
          return;
        }
      }
      q.set(i, F);
      let ee = at,
        z = (yield $e("action", m, j, [v], b, i))[v.route.id];
      if (j.signal.aborted) {
        q.get(i) === F && q.delete(i);
        return;
      }
      if (h.v7_fetcherPersist && le.has(i)) {
        if (Te(z) || ie(z)) {
          ye(i, be(void 0));
          return;
        }
      } else {
        if (Te(z))
          if ((q.delete(i), We > ee)) {
            ye(i, be(void 0));
            return;
          } else
            return (
              fe.add(i),
              ye(i, Xe(P)),
              Le(j, z, !1, { fetcherSubmission: P, preventScrollReset: x })
            );
        if (ie(z)) {
          he(i, s, z.error);
          return;
        }
      }
      if (Re(z)) throw ne(400, { type: "defer-action" });
      let J = m.navigation.location || m.location,
        je = Be(e.history, J, F.signal),
        Ke = d || o,
        me =
          m.navigation.state !== "idle"
            ? De(Ke, m.navigation.location, u)
            : m.matches;
      O(me, "Didn't find any matches after fetcher action");
      let ue = ++at;
      _e.set(i, ue);
      let St = Xe(P, z.data);
      m.fetchers.set(i, St);
      let [Je, Ce] = tr(
        e.history,
        m,
        me,
        P,
        J,
        !1,
        h.v7_skipActionErrorRevalidation,
        ce,
        rt,
        nt,
        le,
        Oe,
        fe,
        Ke,
        u,
        [v.route.id, z],
      );
      (Ce.filter((X) => X.key !== i).forEach((X) => {
        let Ae = X.key,
          Yt = m.fetchers.get(Ae),
          Gr = Xe(void 0, Yt ? Yt.data : void 0);
        (m.fetchers.set(Ae, Gr),
          we(Ae),
          X.controller && q.set(Ae, X.controller));
      }),
        te({ fetchers: new Map(m.fetchers) }));
      let dt = () => Ce.forEach((X) => we(X.key));
      F.signal.addEventListener("abort", dt);
      let { loaderResults: ct, fetcherResults: B } = yield Bt(
        m,
        me,
        Je,
        Ce,
        je,
      );
      if (F.signal.aborted) return;
      (F.signal.removeEventListener("abort", dt),
        _e.delete(i),
        q.delete(i),
        Ce.forEach((X) => q.delete(X.key)));
      let Y = ft(ct);
      if (Y) return Le(je, Y.result, !1, { preventScrollReset: x });
      if (((Y = ft(B)), Y))
        return (fe.add(Y.key), Le(je, Y.result, !1, { preventScrollReset: x }));
      let { loaderData: Ie, errors: Ye } = or(m, me, ct, void 0, Ce, B, xe);
      if (m.fetchers.has(i)) {
        let X = be(z.data);
        m.fetchers.set(i, X);
      }
      (Wt(ue),
        m.navigation.state === "loading" && ue > We
          ? (O(T, "Expected pending action"),
            _ && _.abort(),
            Ne(m.navigation.location, {
              matches: me,
              loaderData: Ie,
              errors: Ye,
              fetchers: new Map(m.fetchers),
            }))
          : (te({
              errors: Ye,
              loaderData: lr(m.loaderData, Ie, me, Ye),
              fetchers: new Map(m.fetchers),
            }),
            (ce = !1)));
    });
  }
  function Hr(i, s, c, v, b, D, U, x, P) {
    return K(this, null, function* () {
      let E = m.fetchers.get(i);
      ye(i, Xe(P, E ? E.data : void 0), { flushSync: U });
      let C = new AbortController(),
        F = Be(e.history, c, C.signal);
      if (D) {
        let z = yield ut(b, new URL(F.url).pathname, F.signal, i);
        if (z.type === "aborted") return;
        if (z.type === "error") {
          he(i, s, z.error, { flushSync: U });
          return;
        } else if (z.matches) ((b = z.matches), (v = Ze(b, c)));
        else {
          he(i, s, ne(404, { pathname: c }), { flushSync: U });
          return;
        }
      }
      q.set(i, C);
      let j = at,
        W = (yield $e("loader", m, F, [v], b, i))[v.route.id];
      if (
        (Re(W) && (W = (yield _t(W, F.signal, !0)) || W),
        q.get(i) === C && q.delete(i),
        !F.signal.aborted)
      ) {
        if (le.has(i)) {
          ye(i, be(void 0));
          return;
        }
        if (Te(W))
          if (We > j) {
            ye(i, be(void 0));
            return;
          } else {
            (fe.add(i), yield Le(F, W, !1, { preventScrollReset: x }));
            return;
          }
        if (ie(W)) {
          he(i, s, W.error);
          return;
        }
        (O(!Re(W), "Unhandled fetcher deferred data"), ye(i, be(W.data)));
      }
    });
  }
  function Le(i, s, c, v) {
    return K(this, null, function* () {
      let {
        submission: b,
        fetcherSubmission: D,
        preventScrollReset: U,
        replace: x,
      } = v === void 0 ? {} : v;
      s.response.headers.has("X-Remix-Revalidate") && (ce = !0);
      let P = s.response.headers.get("Location");
      (O(P, "Expected a Location header on the redirect Response"),
        (P = ar(P, new URL(i.url), u)));
      let E = qe(m.location, P, { _isRedirect: !0 });
      if (r) {
        let z = !1;
        if (s.response.headers.has("X-Remix-Reload-Document")) z = !0;
        else if (Ft.test(P)) {
          const J = e.history.createURL(P);
          z = J.origin !== t.location.origin || ve(J.pathname, u) == null;
        }
        if (z) {
          x ? t.location.replace(P) : t.location.assign(P);
          return;
        }
      }
      _ = null;
      let C =
          x === !0 || s.response.headers.has("X-Remix-Replace")
            ? Q.Replace
            : Q.Push,
        { formMethod: F, formAction: j, formEncType: ee } = m.navigation;
      !b && !D && F && j && ee && (b = cr(m.navigation));
      let W = b || D;
      if (Cn.has(s.response.status) && W && se(W.formMethod))
        yield Pe(C, E, {
          submission: V({}, W, { formAction: P }),
          preventScrollReset: U || H,
          enableViewTransition: c ? Z : void 0,
        });
      else {
        let z = Ct(E, b);
        yield Pe(C, E, {
          overrideNavigation: z,
          fetcherSubmission: D,
          preventScrollReset: U || H,
          enableViewTransition: c ? Z : void 0,
        });
      }
    });
  }
  function $e(i, s, c, v, b, D) {
    return K(this, null, function* () {
      let U,
        x = {};
      try {
        U = yield Nn(f, i, s, c, v, b, D, l, a);
      } catch (P) {
        return (
          v.forEach((E) => {
            x[E.route.id] = { type: k.error, error: P };
          }),
          x
        );
      }
      for (let [P, E] of Object.entries(U))
        if (kn(E)) {
          let C = E.result;
          x[P] = {
            type: k.redirect,
            response: An(C, c, P, b, u, h.v7_relativeSplatPath),
          };
        } else x[P] = yield In(E);
      return x;
    });
  }
  function Bt(i, s, c, v, b) {
    return K(this, null, function* () {
      let D = i.matches,
        U = $e("loader", i, b, c, s, null),
        x = Promise.all(
          v.map((C) =>
            K(this, null, function* () {
              if (C.matches && C.match && C.controller) {
                let j = (yield $e(
                  "loader",
                  i,
                  Be(e.history, C.path, C.controller.signal),
                  [C.match],
                  C.matches,
                  C.key,
                ))[C.match.route.id];
                return { [C.key]: j };
              } else
                return Promise.resolve({
                  [C.key]: {
                    type: k.error,
                    error: ne(404, { pathname: C.path }),
                  },
                });
            }),
          ),
        ),
        P = yield U,
        E = (yield x).reduce((C, F) => Object.assign(C, F), {});
      return (
        yield Promise.all([Vn(s, P, b.signal, D, i.loaderData), $n(s, E, v)]),
        { loaderResults: P, fetcherResults: E }
      );
    });
  }
  function Rt() {
    ((ce = !0),
      rt.push(...xt()),
      Oe.forEach((i, s) => {
        (q.has(s) && nt.add(s), we(s));
      }));
  }
  function ye(i, s, c) {
    (c === void 0 && (c = {}),
      m.fetchers.set(i, s),
      te(
        { fetchers: new Map(m.fetchers) },
        { flushSync: (c && c.flushSync) === !0 },
      ));
  }
  function he(i, s, c, v) {
    v === void 0 && (v = {});
    let b = Me(m.matches, s);
    (ot(i),
      te(
        { errors: { [b.route.id]: c }, fetchers: new Map(m.fetchers) },
        { flushSync: (v && v.flushSync) === !0 },
      ));
  }
  function zt(i) {
    return (
      Ve.set(i, (Ve.get(i) || 0) + 1),
      le.has(i) && le.delete(i),
      m.fetchers.get(i) || Dn
    );
  }
  function ot(i) {
    let s = m.fetchers.get(i);
    (q.has(i) && !(s && s.state === "loading" && _e.has(i)) && we(i),
      Oe.delete(i),
      _e.delete(i),
      fe.delete(i),
      h.v7_fetcherPersist && le.delete(i),
      nt.delete(i),
      m.fetchers.delete(i));
  }
  function Wr(i) {
    let s = (Ve.get(i) || 0) - 1;
    (s <= 0
      ? (Ve.delete(i), le.add(i), h.v7_fetcherPersist || ot(i))
      : Ve.set(i, s),
      te({ fetchers: new Map(m.fetchers) }));
  }
  function we(i) {
    let s = q.get(i);
    s && (s.abort(), q.delete(i));
  }
  function kt(i) {
    for (let s of i) {
      let c = zt(s),
        v = be(c.data);
      m.fetchers.set(s, v);
    }
  }
  function Ht() {
    let i = [],
      s = !1;
    for (let c of fe) {
      let v = m.fetchers.get(c);
      (O(v, "Expected fetcher: " + c),
        v.state === "loading" && (fe.delete(c), i.push(c), (s = !0)));
    }
    return (kt(i), s);
  }
  function Wt(i) {
    let s = [];
    for (let [c, v] of _e)
      if (v < i) {
        let b = m.fetchers.get(c);
        (O(b, "Expected fetcher: " + c),
          b.state === "loading" && (we(c), _e.delete(c), s.push(c)));
      }
    return (kt(s), s.length > 0);
  }
  function Vr(i, s) {
    let c = m.blockers.get(i) || Ge;
    return (Se.get(i) !== s && Se.set(i, s), c);
  }
  function Vt(i) {
    (m.blockers.delete(i), Se.delete(i));
  }
  function lt(i, s) {
    let c = m.blockers.get(i) || Ge;
    O(
      (c.state === "unblocked" && s.state === "blocked") ||
        (c.state === "blocked" && s.state === "blocked") ||
        (c.state === "blocked" && s.state === "proceeding") ||
        (c.state === "blocked" && s.state === "unblocked") ||
        (c.state === "proceeding" && s.state === "unblocked"),
      "Invalid blocker state transition: " + c.state + " -> " + s.state,
    );
    let v = new Map(m.blockers);
    (v.set(i, s), te({ blockers: v }));
  }
  function $t(i) {
    let { currentLocation: s, nextLocation: c, historyAction: v } = i;
    if (Se.size === 0) return;
    Se.size > 1 && Ue(!1, "A router only supports one blocker at a time");
    let b = Array.from(Se.entries()),
      [D, U] = b[b.length - 1],
      x = m.blockers.get(D);
    if (
      !(x && x.state === "proceeding") &&
      U({ currentLocation: s, nextLocation: c, historyAction: v })
    )
      return D;
  }
  function Et(i) {
    let s = ne(404, { pathname: i }),
      c = d || o,
      { matches: v, route: b } = ur(c);
    return (xt(), { notFoundMatches: v, route: b, error: s });
  }
  function xt(i) {
    let s = [];
    return (
      xe.forEach((c, v) => {
        (!i || i(v)) && (c.cancel(), s.push(v), xe.delete(v));
      }),
      s
    );
  }
  function $r(i, s, c) {
    if (((S = i), (M = s), (R = c || null), !I && m.navigation === Lt)) {
      I = !0;
      let v = Jt(m.location, m.matches);
      v != null && te({ restoreScrollPosition: v });
    }
    return () => {
      ((S = null), (M = null), (R = null));
    };
  }
  function Kt(i, s) {
    return (
      (R &&
        R(
          i,
          s.map((v) => nn(v, m.loaderData)),
        )) ||
      i.key
    );
  }
  function Kr(i, s) {
    if (S && M) {
      let c = Kt(i, s);
      S[c] = M();
    }
  }
  function Jt(i, s) {
    if (S) {
      let c = Kt(i, s),
        v = S[c];
      if (typeof v == "number") return v;
    }
    return null;
  }
  function st(i, s, c) {
    if (p)
      if (i) {
        if (Object.keys(i[0].params).length > 0)
          return { active: !0, matches: ht(s, c, u, !0) };
      } else return { active: !0, matches: ht(s, c, u, !0) || [] };
    return { active: !1, matches: null };
  }
  function ut(i, s, c, v) {
    return K(this, null, function* () {
      if (!p) return { type: "success", matches: i };
      let b = i;
      for (;;) {
        let D = d == null,
          U = d || o,
          x = l;
        try {
          yield p({
            signal: c,
            path: s,
            matches: b,
            fetcherKey: v,
            patch: (C, F) => {
              c.aborted || nr(C, F, U, x, a);
            },
          });
        } catch (C) {
          return { type: "error", error: C, partialMatches: b };
        } finally {
          D && !c.aborted && (o = [...o]);
        }
        if (c.aborted) return { type: "aborted" };
        let P = De(U, s, u);
        if (P) return { type: "success", matches: P };
        let E = ht(U, s, u, !0);
        if (
          !E ||
          (b.length === E.length &&
            b.every((C, F) => C.route.id === E[F].route.id))
        )
          return { type: "success", matches: null };
        b = E;
      }
    });
  }
  function Jr(i) {
    ((l = {}), (d = mt(i, a, void 0, l)));
  }
  function Yr(i, s) {
    let c = d == null;
    (nr(i, s, d || o, l, a), c && ((o = [...o]), te({})));
  }
  return (
    (oe = {
      get basename() {
        return u;
      },
      get future() {
        return h;
      },
      get state() {
        return m;
      },
      get routes() {
        return o;
      },
      get window() {
        return t;
      },
      initialize: _r,
      subscribe: Nr,
      enableScrollRestoration: $r,
      navigate: It,
      fetch: zr,
      revalidate: jr,
      createHref: (i) => e.history.createHref(i),
      encodeLocation: (i) => e.history.encodeLocation(i),
      getFetcher: zt,
      deleteFetcher: Wr,
      dispose: Or,
      getBlocker: Vr,
      deleteBlocker: Vt,
      patchRoutes: Yr,
      _internalFetchControllers: q,
      _internalActiveDeferreds: xe,
      _internalSetRoutes: Jr,
    }),
    oe
  );
}
function Un(e) {
  return (
    e != null &&
    (("formData" in e && e.formData != null) ||
      ("body" in e && e.body !== void 0))
  );
}
function Dt(e, t, r, n, a, l, o, d) {
  let u, f;
  if (o) {
    u = [];
    for (let h of t)
      if ((u.push(h), h.route.id === o)) {
        f = h;
        break;
      }
  } else ((u = t), (f = t[t.length - 1]));
  let p = wt(a || ".", yt(u, l), ve(e.pathname, r) || e.pathname, d === "path");
  if (
    (a == null && ((p.search = e.search), (p.hash = e.hash)),
    (a == null || a === "" || a === ".") && f)
  ) {
    let h = Ot(p.search);
    if (f.route.index && !h)
      p.search = p.search ? p.search.replace(/^\?/, "?index&") : "?index";
    else if (!f.route.index && h) {
      let y = new URLSearchParams(p.search),
        w = y.getAll("index");
      (y.delete("index"),
        w.filter((R) => R).forEach((R) => y.append("index", R)));
      let S = y.toString();
      p.search = S ? "?" + S : "";
    }
  }
  return (
    n &&
      r !== "/" &&
      (p.pathname = p.pathname === "/" ? r : pe([r, p.pathname])),
    Fe(p)
  );
}
function qt(e, t, r, n) {
  if (!n || !Un(n)) return { path: r };
  if (n.formMethod && !Wn(n.formMethod))
    return { path: r, error: ne(405, { method: n.formMethod }) };
  let a = () => ({ path: r, error: ne(400, { type: "invalid-body" }) }),
    l = n.formMethod || "get",
    o = e ? l.toUpperCase() : l.toLowerCase(),
    d = xr(r);
  if (n.body !== void 0) {
    if (n.formEncType === "text/plain") {
      if (!se(o)) return a();
      let y =
        typeof n.body == "string"
          ? n.body
          : n.body instanceof FormData || n.body instanceof URLSearchParams
            ? Array.from(n.body.entries()).reduce((w, S) => {
                let [R, M] = S;
                return (
                  "" +
                  w +
                  R +
                  "=" +
                  M +
                  `
`
                );
              }, "")
            : String(n.body);
      return {
        path: r,
        submission: {
          formMethod: o,
          formAction: d,
          formEncType: n.formEncType,
          formData: void 0,
          json: void 0,
          text: y,
        },
      };
    } else if (n.formEncType === "application/json") {
      if (!se(o)) return a();
      try {
        let y = typeof n.body == "string" ? JSON.parse(n.body) : n.body;
        return {
          path: r,
          submission: {
            formMethod: o,
            formAction: d,
            formEncType: n.formEncType,
            formData: void 0,
            json: y,
            text: void 0,
          },
        };
      } catch (y) {
        return a();
      }
    }
  }
  O(
    typeof FormData == "function",
    "FormData is not available in this environment",
  );
  let u, f;
  if (n.formData) ((u = Tt(n.formData)), (f = n.formData));
  else if (n.body instanceof FormData) ((u = Tt(n.body)), (f = n.body));
  else if (n.body instanceof URLSearchParams) ((u = n.body), (f = ir(u)));
  else if (n.body == null) ((u = new URLSearchParams()), (f = new FormData()));
  else
    try {
      ((u = new URLSearchParams(n.body)), (f = ir(u)));
    } catch (y) {
      return a();
    }
  let p = {
    formMethod: o,
    formAction: d,
    formEncType: (n && n.formEncType) || "application/x-www-form-urlencoded",
    formData: f,
    json: void 0,
    text: void 0,
  };
  if (se(p.formMethod)) return { path: r, submission: p };
  let h = Ee(r);
  return (
    t && h.search && Ot(h.search) && u.append("index", ""),
    (h.search = "?" + u),
    { path: Fe(h), submission: p }
  );
}
function er(e, t, r) {
  r === void 0 && (r = !1);
  let n = e.findIndex((a) => a.route.id === t);
  return n >= 0 ? e.slice(0, r ? n + 1 : n) : e;
}
function tr(e, t, r, n, a, l, o, d, u, f, p, h, y, w, S, R) {
  let M = R ? (ie(R[1]) ? R[1].error : R[1].data) : void 0,
    I = e.createURL(t.location),
    L = e.createURL(a),
    N = r;
  l && t.errors
    ? (N = er(r, Object.keys(t.errors)[0], !0))
    : R && ie(R[1]) && (N = er(r, R[0]));
  let A = R ? R[1].statusCode : void 0,
    $ = o && A && A >= 400,
    oe = N.filter((T, H) => {
      let { route: _ } = T;
      if (_.lazy) return !0;
      if (_.loader == null) return !1;
      if (l) return Mt(_, t.loaderData, t.errors);
      if (
        Fn(t.loaderData, t.matches[H], T) ||
        u.some((ae) => ae === T.route.id)
      )
        return !0;
      let Z = t.matches[H],
        G = T;
      return rr(
        T,
        V(
          {
            currentUrl: I,
            currentParams: Z.params,
            nextUrl: L,
            nextParams: G.params,
          },
          n,
          {
            actionResult: M,
            actionStatus: A,
            defaultShouldRevalidate: $
              ? !1
              : d ||
                I.pathname + I.search === L.pathname + L.search ||
                I.search !== L.search ||
                Rr(Z, G),
          },
        ),
      );
    }),
    m = [];
  return (
    h.forEach((T, H) => {
      if (l || !r.some((re) => re.route.id === T.routeId) || p.has(H)) return;
      let _ = De(w, T.path, S);
      if (!_) {
        m.push({
          key: H,
          routeId: T.routeId,
          path: T.path,
          matches: null,
          match: null,
          controller: null,
        });
        return;
      }
      let Z = t.fetchers.get(H),
        G = Ze(_, T.path),
        ae = !1;
      (y.has(H)
        ? (ae = !1)
        : f.has(H)
          ? (f.delete(H), (ae = !0))
          : Z && Z.state !== "idle" && Z.data === void 0
            ? (ae = d)
            : (ae = rr(
                G,
                V(
                  {
                    currentUrl: I,
                    currentParams: t.matches[t.matches.length - 1].params,
                    nextUrl: L,
                    nextParams: r[r.length - 1].params,
                  },
                  n,
                  {
                    actionResult: M,
                    actionStatus: A,
                    defaultShouldRevalidate: $ ? !1 : d,
                  },
                ),
              )),
        ae &&
          m.push({
            key: H,
            routeId: T.routeId,
            path: T.path,
            matches: _,
            match: G,
            controller: new AbortController(),
          }));
    }),
    [oe, m]
  );
}
function Mt(e, t, r) {
  if (e.lazy) return !0;
  if (!e.loader) return !1;
  let n = t != null && t[e.id] !== void 0,
    a = r != null && r[e.id] !== void 0;
  return !n && a
    ? !1
    : typeof e.loader == "function" && e.loader.hydrate === !0
      ? !0
      : !n && !a;
}
function Fn(e, t, r) {
  let n = !t || r.route.id !== t.route.id,
    a = e[r.route.id] === void 0;
  return n || a;
}
function Rr(e, t) {
  let r = e.route.path;
  return (
    e.pathname !== t.pathname ||
    (r != null && r.endsWith("*") && e.params["*"] !== t.params["*"])
  );
}
function rr(e, t) {
  if (e.route.shouldRevalidate) {
    let r = e.route.shouldRevalidate(t);
    if (typeof r == "boolean") return r;
  }
  return t.defaultShouldRevalidate;
}
function nr(e, t, r, n, a) {
  var l;
  let o;
  if (e) {
    let f = n[e];
    (O(f, "No route found to patch children into: routeId = " + e),
      f.children || (f.children = []),
      (o = f.children));
  } else o = r;
  let d = t.filter((f) => !o.some((p) => Er(f, p))),
    u = mt(
      d,
      a,
      [e || "_", "patch", String(((l = o) == null ? void 0 : l.length) || "0")],
      n,
    );
  o.push(...u);
}
function Er(e, t) {
  return "id" in e && "id" in t && e.id === t.id
    ? !0
    : e.index === t.index &&
        e.path === t.path &&
        e.caseSensitive === t.caseSensitive
      ? (!e.children || e.children.length === 0) &&
        (!t.children || t.children.length === 0)
        ? !0
        : e.children.every((r, n) => {
            var a;
            return (a = t.children) == null ? void 0 : a.some((l) => Er(r, l));
          })
      : !1;
}
function _n(e, t, r) {
  return K(this, null, function* () {
    if (!e.lazy) return;
    let n = yield e.lazy();
    if (!e.lazy) return;
    let a = r[e.id];
    O(a, "No route found in manifest");
    let l = {};
    for (let o in n) {
      let u = a[o] !== void 0 && o !== "hasErrorBoundary";
      (Ue(
        !u,
        'Route "' +
          a.id +
          '" has a static property "' +
          o +
          '" defined but its lazy function is also returning a value for this property. ' +
          ('The lazy route property "' + o + '" will be ignored.'),
      ),
        !u && !tn.has(o) && (l[o] = n[o]));
    }
    (Object.assign(a, l), Object.assign(a, V({}, t(a), { lazy: void 0 })));
  });
}
function On(e) {
  return K(this, null, function* () {
    let { matches: t } = e,
      r = t.filter((a) => a.shouldLoad);
    return (yield Promise.all(r.map((a) => a.resolve()))).reduce(
      (a, l, o) => Object.assign(a, { [r[o].route.id]: l }),
      {},
    );
  });
}
function Nn(e, t, r, n, a, l, o, d, u, f) {
  return K(this, null, function* () {
    let p = l.map((w) => (w.route.lazy ? _n(w.route, u, d) : void 0)),
      h = l.map((w, S) => {
        let R = p[S],
          M = a.some((L) => L.route.id === w.route.id);
        return V({}, w, {
          shouldLoad: M,
          resolve: (L) =>
            K(this, null, function* () {
              return (
                L &&
                  n.method === "GET" &&
                  (w.route.lazy || w.route.loader) &&
                  (M = !0),
                M
                  ? jn(t, n, w, R, L, f)
                  : Promise.resolve({ type: k.data, result: void 0 })
              );
            }),
        });
      }),
      y = yield e({
        matches: h,
        request: n,
        params: l[0].params,
        fetcherKey: o,
        context: f,
      });
    try {
      yield Promise.all(p);
    } catch (w) {}
    return y;
  });
}
function jn(e, t, r, n, a, l) {
  return K(this, null, function* () {
    let o,
      d,
      u = (f) => {
        let p,
          h = new Promise((S, R) => (p = R));
        ((d = () => p()), t.signal.addEventListener("abort", d));
        let y = (S) =>
            typeof f != "function"
              ? Promise.reject(
                  new Error(
                    "You cannot call the handler for a route which defines a boolean " +
                      ('"' + e + '" [routeId: ' + r.route.id + "]"),
                  ),
                )
              : f(
                  { request: t, params: r.params, context: l },
                  ...(S !== void 0 ? [S] : []),
                ),
          w = K(this, null, function* () {
            try {
              return { type: "data", result: yield a ? a((R) => y(R)) : y() };
            } catch (S) {
              return { type: "error", result: S };
            }
          });
        return Promise.race([w, h]);
      };
    try {
      let f = r.route[e];
      if (n)
        if (f) {
          let p,
            [h] = yield Promise.all([
              u(f).catch((y) => {
                p = y;
              }),
              n,
            ]);
          if (p !== void 0) throw p;
          o = h;
        } else if ((yield n, (f = r.route[e]), f)) o = yield u(f);
        else if (e === "action") {
          let p = new URL(t.url),
            h = p.pathname + p.search;
          throw ne(405, { method: t.method, pathname: h, routeId: r.route.id });
        } else return { type: k.data, result: void 0 };
      else if (f) o = yield u(f);
      else {
        let p = new URL(t.url),
          h = p.pathname + p.search;
        throw ne(404, { pathname: h });
      }
      O(
        o.result !== void 0,
        "You defined " +
          (e === "action" ? "an action" : "a loader") +
          " for route " +
          ('"' +
            r.route.id +
            "\" but didn't return anything from your `" +
            e +
            "` ") +
          "function. Please return a value or `null`.",
      );
    } catch (f) {
      return { type: k.error, result: f };
    } finally {
      d && t.signal.removeEventListener("abort", d);
    }
    return o;
  });
}
function In(e) {
  return K(this, null, function* () {
    let { result: t, type: r } = e;
    if (Sr(t)) {
      let h;
      try {
        let y = t.headers.get("Content-Type");
        y && /\bapplication\/json\b/.test(y)
          ? t.body == null
            ? (h = null)
            : (h = yield t.json())
          : (h = yield t.text());
      } catch (y) {
        return { type: k.error, error: y };
      }
      return r === k.error
        ? {
            type: k.error,
            error: new vt(t.status, t.statusText, h),
            statusCode: t.status,
            headers: t.headers,
          }
        : { type: k.data, data: h, statusCode: t.status, headers: t.headers };
    }
    if (r === k.error) {
      if (dr(t)) {
        var n, a;
        if (t.data instanceof Error) {
          var l, o;
          return {
            type: k.error,
            error: t.data,
            statusCode: (l = t.init) == null ? void 0 : l.status,
            headers:
              (o = t.init) != null && o.headers
                ? new Headers(t.init.headers)
                : void 0,
          };
        }
        return {
          type: k.error,
          error: new vt(
            ((n = t.init) == null ? void 0 : n.status) || 500,
            void 0,
            t.data,
          ),
          statusCode: et(t) ? t.status : void 0,
          headers:
            (a = t.init) != null && a.headers
              ? new Headers(t.init.headers)
              : void 0,
        };
      }
      return { type: k.error, error: t, statusCode: et(t) ? t.status : void 0 };
    }
    if (Hn(t)) {
      var d, u;
      return {
        type: k.deferred,
        deferredData: t,
        statusCode: (d = t.init) == null ? void 0 : d.status,
        headers:
          ((u = t.init) == null ? void 0 : u.headers) &&
          new Headers(t.init.headers),
      };
    }
    if (dr(t)) {
      var f, p;
      return {
        type: k.data,
        data: t.data,
        statusCode: (f = t.init) == null ? void 0 : f.status,
        headers:
          (p = t.init) != null && p.headers
            ? new Headers(t.init.headers)
            : void 0,
      };
    }
    return { type: k.data, data: t };
  });
}
function An(e, t, r, n, a, l) {
  let o = e.headers.get("Location");
  if (
    (O(
      o,
      "Redirects returned/thrown from loaders/actions must have a Location header",
    ),
    !Ft.test(o))
  ) {
    let d = n.slice(0, n.findIndex((u) => u.route.id === r) + 1);
    ((o = Dt(new URL(t.url), d, a, !0, o, l)), e.headers.set("Location", o));
  }
  return e;
}
function ar(e, t, r) {
  if (Ft.test(e)) {
    let n = e,
      a = n.startsWith("//") ? new URL(t.protocol + n) : new URL(n),
      l = ve(a.pathname, r) != null;
    if (a.origin === t.origin && l) return a.pathname + a.search + a.hash;
  }
  return e;
}
function Be(e, t, r, n) {
  let a = e.createURL(xr(t)).toString(),
    l = { signal: r };
  if (n && se(n.formMethod)) {
    let { formMethod: o, formEncType: d } = n;
    ((l.method = o.toUpperCase()),
      d === "application/json"
        ? ((l.headers = new Headers({ "Content-Type": d })),
          (l.body = JSON.stringify(n.json)))
        : d === "text/plain"
          ? (l.body = n.text)
          : d === "application/x-www-form-urlencoded" && n.formData
            ? (l.body = Tt(n.formData))
            : (l.body = n.formData));
  }
  return new Request(a, l);
}
function Tt(e) {
  let t = new URLSearchParams();
  for (let [r, n] of e.entries())
    t.append(r, typeof n == "string" ? n : n.name);
  return t;
}
function ir(e) {
  let t = new FormData();
  for (let [r, n] of e.entries()) t.append(r, n);
  return t;
}
function Bn(e, t, r, n, a) {
  let l = {},
    o = null,
    d,
    u = !1,
    f = {},
    p = r && ie(r[1]) ? r[1].error : void 0;
  return (
    e.forEach((h) => {
      if (!(h.route.id in t)) return;
      let y = h.route.id,
        w = t[y];
      if (
        (O(!Te(w), "Cannot handle redirect results in processLoaderData"),
        ie(w))
      ) {
        let S = w.error;
        (p !== void 0 && ((S = p), (p = void 0)), (o = o || {}));
        {
          let R = Me(e, y);
          o[R.route.id] == null && (o[R.route.id] = S);
        }
        ((l[y] = void 0),
          u || ((u = !0), (d = et(w.error) ? w.error.status : 500)),
          w.headers && (f[y] = w.headers));
      } else
        Re(w)
          ? (n.set(y, w.deferredData),
            (l[y] = w.deferredData.data),
            w.statusCode != null &&
              w.statusCode !== 200 &&
              !u &&
              (d = w.statusCode),
            w.headers && (f[y] = w.headers))
          : ((l[y] = w.data),
            w.statusCode && w.statusCode !== 200 && !u && (d = w.statusCode),
            w.headers && (f[y] = w.headers));
    }),
    p !== void 0 && r && ((o = { [r[0]]: p }), (l[r[0]] = void 0)),
    { loaderData: l, errors: o, statusCode: d || 200, loaderHeaders: f }
  );
}
function or(e, t, r, n, a, l, o) {
  let { loaderData: d, errors: u } = Bn(t, r, n, o);
  return (
    a.forEach((f) => {
      let { key: p, match: h, controller: y } = f,
        w = l[p];
      if (
        (O(w, "Did not find corresponding fetcher result"),
        !(y && y.signal.aborted))
      )
        if (ie(w)) {
          let S = Me(e.matches, h == null ? void 0 : h.route.id);
          ((u && u[S.route.id]) || (u = V({}, u, { [S.route.id]: w.error })),
            e.fetchers.delete(p));
        } else if (Te(w)) O(!1, "Unhandled fetcher revalidation redirect");
        else if (Re(w)) O(!1, "Unhandled fetcher deferred data");
        else {
          let S = be(w.data);
          e.fetchers.set(p, S);
        }
    }),
    { loaderData: d, errors: u }
  );
}
function lr(e, t, r, n) {
  let a = V({}, t);
  for (let l of r) {
    let o = l.route.id;
    if (
      (t.hasOwnProperty(o)
        ? t[o] !== void 0 && (a[o] = t[o])
        : e[o] !== void 0 && l.route.loader && (a[o] = e[o]),
      n && n.hasOwnProperty(o))
    )
      break;
  }
  return a;
}
function sr(e) {
  return e
    ? ie(e[1])
      ? { actionData: {} }
      : { actionData: { [e[0]]: e[1].data } }
    : {};
}
function Me(e, t) {
  return (
    (t ? e.slice(0, e.findIndex((n) => n.route.id === t) + 1) : [...e])
      .reverse()
      .find((n) => n.route.hasErrorBoundary === !0) || e[0]
  );
}
function ur(e) {
  let t =
    e.length === 1
      ? e[0]
      : e.find((r) => r.index || !r.path || r.path === "/") || {
          id: "__shim-error-route__",
        };
  return {
    matches: [{ params: {}, pathname: "", pathnameBase: "", route: t }],
    route: t,
  };
}
function ne(e, t) {
  let {
      pathname: r,
      routeId: n,
      method: a,
      type: l,
      message: o,
    } = t === void 0 ? {} : t,
    d = "Unknown Server Error",
    u = "Unknown @remix-run/router error";
  return (
    e === 400
      ? ((d = "Bad Request"),
        a && r && n
          ? (u =
              "You made a " +
              a +
              ' request to "' +
              r +
              '" but ' +
              ('did not provide a `loader` for route "' + n + '", ') +
              "so there is no way to handle the request.")
          : l === "defer-action"
            ? (u = "defer() is not supported in actions")
            : l === "invalid-body" && (u = "Unable to encode submission body"))
      : e === 403
        ? ((d = "Forbidden"),
          (u = 'Route "' + n + '" does not match URL "' + r + '"'))
        : e === 404
          ? ((d = "Not Found"), (u = 'No route matches URL "' + r + '"'))
          : e === 405 &&
            ((d = "Method Not Allowed"),
            a && r && n
              ? (u =
                  "You made a " +
                  a.toUpperCase() +
                  ' request to "' +
                  r +
                  '" but ' +
                  ('did not provide an `action` for route "' + n + '", ') +
                  "so there is no way to handle the request.")
              : a && (u = 'Invalid request method "' + a.toUpperCase() + '"')),
    new vt(e || 500, d, new Error(u), !0)
  );
}
function ft(e) {
  let t = Object.entries(e);
  for (let r = t.length - 1; r >= 0; r--) {
    let [n, a] = t[r];
    if (Te(a)) return { key: n, result: a };
  }
}
function xr(e) {
  let t = typeof e == "string" ? Ee(e) : e;
  return Fe(V({}, t, { hash: "" }));
}
function zn(e, t) {
  return e.pathname !== t.pathname || e.search !== t.search
    ? !1
    : e.hash === ""
      ? t.hash !== ""
      : e.hash === t.hash
        ? !0
        : t.hash !== "";
}
function kn(e) {
  return Sr(e.result) && Ln.has(e.result.status);
}
function Re(e) {
  return e.type === k.deferred;
}
function ie(e) {
  return e.type === k.error;
}
function Te(e) {
  return (e && e.type) === k.redirect;
}
function dr(e) {
  return (
    typeof e == "object" &&
    e != null &&
    "type" in e &&
    "data" in e &&
    "init" in e &&
    e.type === "DataWithResponseInit"
  );
}
function Hn(e) {
  let t = e;
  return (
    t &&
    typeof t == "object" &&
    typeof t.data == "object" &&
    typeof t.subscribe == "function" &&
    typeof t.cancel == "function" &&
    typeof t.resolveData == "function"
  );
}
function Sr(e) {
  return (
    e != null &&
    typeof e.status == "number" &&
    typeof e.statusText == "string" &&
    typeof e.headers == "object" &&
    typeof e.body != "undefined"
  );
}
function Wn(e) {
  return Pn.has(e.toLowerCase());
}
function se(e) {
  return xn.has(e.toLowerCase());
}
function Vn(e, t, r, n, a) {
  return K(this, null, function* () {
    let l = Object.entries(t);
    for (let o = 0; o < l.length; o++) {
      let [d, u] = l[o],
        f = e.find((y) => (y == null ? void 0 : y.route.id) === d);
      if (!f) continue;
      let p = n.find((y) => y.route.id === f.route.id),
        h = p != null && !Rr(p, f) && (a && a[f.route.id]) !== void 0;
      Re(u) &&
        h &&
        (yield _t(u, r, !1).then((y) => {
          y && (t[d] = y);
        }));
    }
  });
}
function $n(e, t, r) {
  return K(this, null, function* () {
    for (let n = 0; n < r.length; n++) {
      let { key: a, routeId: l, controller: o } = r[n],
        d = t[a];
      e.find((f) => (f == null ? void 0 : f.route.id) === l) &&
        Re(d) &&
        (O(
          o,
          "Expected an AbortController for revalidating fetcher deferred result",
        ),
        yield _t(d, o.signal, !0).then((f) => {
          f && (t[a] = f);
        }));
    }
  });
}
function _t(e, t, r) {
  return K(this, null, function* () {
    if ((r === void 0 && (r = !1), !(yield e.deferredData.resolveData(t)))) {
      if (r)
        try {
          return { type: k.data, data: e.deferredData.unwrappedData };
        } catch (a) {
          return { type: k.error, error: a };
        }
      return { type: k.data, data: e.deferredData.data };
    }
  });
}
function Ot(e) {
  return new URLSearchParams(e).getAll("index").some((t) => t === "");
}
function Ze(e, t) {
  let r = typeof t == "string" ? Ee(t).search : t.search;
  if (e[e.length - 1].route.index && Ot(r || "")) return e[e.length - 1];
  let n = yr(e);
  return n[n.length - 1];
}
function cr(e) {
  let {
    formMethod: t,
    formAction: r,
    formEncType: n,
    text: a,
    formData: l,
    json: o,
  } = e;
  if (!(!t || !r || !n)) {
    if (a != null)
      return {
        formMethod: t,
        formAction: r,
        formEncType: n,
        formData: void 0,
        json: void 0,
        text: a,
      };
    if (l != null)
      return {
        formMethod: t,
        formAction: r,
        formEncType: n,
        formData: l,
        json: void 0,
        text: void 0,
      };
    if (o !== void 0)
      return {
        formMethod: t,
        formAction: r,
        formEncType: n,
        formData: void 0,
        json: o,
        text: void 0,
      };
  }
}
function Ct(e, t) {
  return t
    ? {
        state: "loading",
        location: e,
        formMethod: t.formMethod,
        formAction: t.formAction,
        formEncType: t.formEncType,
        formData: t.formData,
        json: t.json,
        text: t.text,
      }
    : {
        state: "loading",
        location: e,
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
      };
}
function Kn(e, t) {
  return {
    state: "submitting",
    location: e,
    formMethod: t.formMethod,
    formAction: t.formAction,
    formEncType: t.formEncType,
    formData: t.formData,
    json: t.json,
    text: t.text,
  };
}
function Xe(e, t) {
  return e
    ? {
        state: "loading",
        formMethod: e.formMethod,
        formAction: e.formAction,
        formEncType: e.formEncType,
        formData: e.formData,
        json: e.json,
        text: e.text,
        data: t,
      }
    : {
        state: "loading",
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
        data: t,
      };
}
function Jn(e, t) {
  return {
    state: "submitting",
    formMethod: e.formMethod,
    formAction: e.formAction,
    formEncType: e.formEncType,
    formData: e.formData,
    json: e.json,
    text: e.text,
    data: t ? t.data : void 0,
  };
}
function be(e) {
  return {
    state: "idle",
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
    data: e,
  };
}
function Yn(e, t) {
  try {
    let r = e.sessionStorage.getItem(br);
    if (r) {
      let n = JSON.parse(r);
      for (let [a, l] of Object.entries(n || {}))
        l && Array.isArray(l) && t.set(a, new Set(l || []));
    }
  } catch (r) {}
}
function Gn(e, t) {
  if (t.size > 0) {
    let r = {};
    for (let [n, a] of t) r[n] = [...a];
    try {
      e.sessionStorage.setItem(br, JSON.stringify(r));
    } catch (n) {
      Ue(
        !1,
        "Failed to save applied view transitions in sessionStorage (" +
          n +
          ").",
      );
    }
  }
}
/**
 * React Router v6.30.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function gt() {
  return (
    (gt = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var r = arguments[t];
            for (var n in r)
              Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
          }
          return e;
        }),
    gt.apply(this, arguments)
  );
}
const tt = g.createContext(null),
  Nt = g.createContext(null),
  ge = g.createContext(null),
  jt = g.createContext(null),
  de = g.createContext({ outlet: null, matches: [], isDataRoute: !1 }),
  Pr = g.createContext(null);
function Xn(e, t) {
  let { relative: r } = t === void 0 ? {} : t;
  ke() || O(!1);
  let { basename: n, navigator: a } = g.useContext(ge),
    { hash: l, pathname: o, search: d } = bt(e, { relative: r }),
    u = o;
  return (
    n !== "/" && (u = o === "/" ? n : pe([n, o])),
    a.createHref({ pathname: u, search: d, hash: l })
  );
}
function ke() {
  return g.useContext(jt) != null;
}
function He() {
  return (ke() || O(!1), g.useContext(jt).location);
}
function Lr(e) {
  g.useContext(ge).static || g.useLayoutEffect(e);
}
function Cr() {
  let { isDataRoute: e } = g.useContext(de);
  return e ? da() : Qn();
}
function Qn() {
  ke() || O(!1);
  let e = g.useContext(tt),
    { basename: t, future: r, navigator: n } = g.useContext(ge),
    { matches: a } = g.useContext(de),
    { pathname: l } = He(),
    o = JSON.stringify(yt(a, r.v7_relativeSplatPath)),
    d = g.useRef(!1);
  return (
    Lr(() => {
      d.current = !0;
    }),
    g.useCallback(
      function (f, p) {
        if ((p === void 0 && (p = {}), !d.current)) return;
        if (typeof f == "number") {
          n.go(f);
          return;
        }
        let h = wt(f, JSON.parse(o), l, p.relative === "path");
        (e == null &&
          t !== "/" &&
          (h.pathname = h.pathname === "/" ? t : pe([t, h.pathname])),
          (p.replace ? n.replace : n.push)(h, p.state, p));
      },
      [t, n, o, l, e],
    )
  );
}
const Zn = g.createContext(null);
function qn(e) {
  let t = g.useContext(de).outlet;
  return t && g.createElement(Zn.Provider, { value: e }, t);
}
function Ia() {
  let { matches: e } = g.useContext(de),
    t = e[e.length - 1];
  return t ? t.params : {};
}
function bt(e, t) {
  let { relative: r } = t === void 0 ? {} : t,
    { future: n } = g.useContext(ge),
    { matches: a } = g.useContext(de),
    { pathname: l } = He(),
    o = JSON.stringify(yt(a, n.v7_relativeSplatPath));
  return g.useMemo(() => wt(e, JSON.parse(o), l, r === "path"), [e, o, l, r]);
}
function ea(e, t, r, n) {
  ke() || O(!1);
  let { navigator: a } = g.useContext(ge),
    { matches: l } = g.useContext(de),
    o = l[l.length - 1],
    d = o ? o.params : {};
  o && o.pathname;
  let u = o ? o.pathnameBase : "/";
  o && o.route;
  let f = He(),
    p;
  p = f;
  let h = p.pathname || "/",
    y = h;
  if (u !== "/") {
    let R = u.replace(/^\//, "").split("/");
    y = "/" + h.replace(/^\//, "").split("/").slice(R.length).join("/");
  }
  let w = De(e, { pathname: y });
  return ia(
    w &&
      w.map((R) =>
        Object.assign({}, R, {
          params: Object.assign({}, d, R.params),
          pathname: pe([
            u,
            a.encodeLocation
              ? a.encodeLocation(R.pathname).pathname
              : R.pathname,
          ]),
          pathnameBase:
            R.pathnameBase === "/"
              ? u
              : pe([
                  u,
                  a.encodeLocation
                    ? a.encodeLocation(R.pathnameBase).pathname
                    : R.pathnameBase,
                ]),
        }),
      ),
    l,
    r,
    n,
  );
}
function ta() {
  let e = ua(),
    t = et(e)
      ? e.status + " " + e.statusText
      : e instanceof Error
        ? e.message
        : JSON.stringify(e),
    r = e instanceof Error ? e.stack : null,
    a = { padding: "0.5rem", backgroundColor: "rgba(200,200,200, 0.5)" };
  return g.createElement(
    g.Fragment,
    null,
    g.createElement("h2", null, "Unexpected Application Error!"),
    g.createElement("h3", { style: { fontStyle: "italic" } }, t),
    r ? g.createElement("pre", { style: a }, r) : null,
    null,
  );
}
const ra = g.createElement(ta, null);
class na extends g.Component {
  constructor(t) {
    (super(t),
      (this.state = {
        location: t.location,
        revalidation: t.revalidation,
        error: t.error,
      }));
  }
  static getDerivedStateFromError(t) {
    return { error: t };
  }
  static getDerivedStateFromProps(t, r) {
    return r.location !== t.location ||
      (r.revalidation !== "idle" && t.revalidation === "idle")
      ? { error: t.error, location: t.location, revalidation: t.revalidation }
      : {
          error: t.error !== void 0 ? t.error : r.error,
          location: r.location,
          revalidation: t.revalidation || r.revalidation,
        };
  }
  componentDidCatch(t, r) {
    console.error(
      "React Router caught the following error during render",
      t,
      r,
    );
  }
  render() {
    return this.state.error !== void 0
      ? g.createElement(
          de.Provider,
          { value: this.props.routeContext },
          g.createElement(Pr.Provider, {
            value: this.state.error,
            children: this.props.component,
          }),
        )
      : this.props.children;
  }
}
function aa(e) {
  let { routeContext: t, match: r, children: n } = e,
    a = g.useContext(tt);
  return (
    a &&
      a.static &&
      a.staticContext &&
      (r.route.errorElement || r.route.ErrorBoundary) &&
      (a.staticContext._deepestRenderedBoundaryId = r.route.id),
    g.createElement(de.Provider, { value: t }, n)
  );
}
function ia(e, t, r, n) {
  var a;
  if (
    (t === void 0 && (t = []),
    r === void 0 && (r = null),
    n === void 0 && (n = null),
    e == null)
  ) {
    var l;
    if (!r) return null;
    if (r.errors) e = r.matches;
    else if (
      (l = n) != null &&
      l.v7_partialHydration &&
      t.length === 0 &&
      !r.initialized &&
      r.matches.length > 0
    )
      e = r.matches;
    else return null;
  }
  let o = e,
    d = (a = r) == null ? void 0 : a.errors;
  if (d != null) {
    let p = o.findIndex(
      (h) => h.route.id && (d == null ? void 0 : d[h.route.id]) !== void 0,
    );
    (p >= 0 || O(!1), (o = o.slice(0, Math.min(o.length, p + 1))));
  }
  let u = !1,
    f = -1;
  if (r && n && n.v7_partialHydration)
    for (let p = 0; p < o.length; p++) {
      let h = o[p];
      if (
        ((h.route.HydrateFallback || h.route.hydrateFallbackElement) && (f = p),
        h.route.id)
      ) {
        let { loaderData: y, errors: w } = r,
          S =
            h.route.loader &&
            y[h.route.id] === void 0 &&
            (!w || w[h.route.id] === void 0);
        if (h.route.lazy || S) {
          ((u = !0), f >= 0 ? (o = o.slice(0, f + 1)) : (o = [o[0]]));
          break;
        }
      }
    }
  return o.reduceRight((p, h, y) => {
    let w,
      S = !1,
      R = null,
      M = null;
    r &&
      ((w = d && h.route.id ? d[h.route.id] : void 0),
      (R = h.route.errorElement || ra),
      u &&
        (f < 0 && y === 0
          ? (ca("route-fallback"), (S = !0), (M = null))
          : f === y &&
            ((S = !0), (M = h.route.hydrateFallbackElement || null))));
    let I = t.concat(o.slice(0, y + 1)),
      L = () => {
        let N;
        return (
          w
            ? (N = R)
            : S
              ? (N = M)
              : h.route.Component
                ? (N = g.createElement(h.route.Component, null))
                : h.route.element
                  ? (N = h.route.element)
                  : (N = p),
          g.createElement(aa, {
            match: h,
            routeContext: { outlet: p, matches: I, isDataRoute: r != null },
            children: N,
          })
        );
      };
    return r && (h.route.ErrorBoundary || h.route.errorElement || y === 0)
      ? g.createElement(na, {
          location: r.location,
          revalidation: r.revalidation,
          component: R,
          error: w,
          children: L(),
          routeContext: { outlet: null, matches: I, isDataRoute: !0 },
        })
      : L();
  }, null);
}
var Dr = (function (e) {
    return (
      (e.UseBlocker = "useBlocker"),
      (e.UseRevalidator = "useRevalidator"),
      (e.UseNavigateStable = "useNavigate"),
      e
    );
  })(Dr || {}),
  Mr = (function (e) {
    return (
      (e.UseBlocker = "useBlocker"),
      (e.UseLoaderData = "useLoaderData"),
      (e.UseActionData = "useActionData"),
      (e.UseRouteError = "useRouteError"),
      (e.UseNavigation = "useNavigation"),
      (e.UseRouteLoaderData = "useRouteLoaderData"),
      (e.UseMatches = "useMatches"),
      (e.UseRevalidator = "useRevalidator"),
      (e.UseNavigateStable = "useNavigate"),
      (e.UseRouteId = "useRouteId"),
      e
    );
  })(Mr || {});
function oa(e) {
  let t = g.useContext(tt);
  return (t || O(!1), t);
}
function la(e) {
  let t = g.useContext(Nt);
  return (t || O(!1), t);
}
function sa(e) {
  let t = g.useContext(de);
  return (t || O(!1), t);
}
function Tr(e) {
  let t = sa(),
    r = t.matches[t.matches.length - 1];
  return (r.route.id || O(!1), r.route.id);
}
function ua() {
  var e;
  let t = g.useContext(Pr),
    r = la(),
    n = Tr();
  return t !== void 0 ? t : (e = r.errors) == null ? void 0 : e[n];
}
function da() {
  let { router: e } = oa(Dr.UseNavigateStable),
    t = Tr(Mr.UseNavigateStable),
    r = g.useRef(!1);
  return (
    Lr(() => {
      r.current = !0;
    }),
    g.useCallback(
      function (a, l) {
        (l === void 0 && (l = {}),
          r.current &&
            (typeof a == "number"
              ? e.navigate(a)
              : e.navigate(a, gt({ fromRouteId: t }, l))));
      },
      [e, t],
    )
  );
}
const fr = {};
function ca(e, t, r) {
  fr[e] || (fr[e] = !0);
}
function fa(e, t) {
  (e == null || e.v7_startTransition,
    (e == null ? void 0 : e.v7_relativeSplatPath) === void 0 &&
      (!t || t.v7_relativeSplatPath),
    t &&
      (t.v7_fetcherPersist,
      t.v7_normalizeFormMethod,
      t.v7_partialHydration,
      t.v7_skipActionErrorRevalidation));
}
function Aa(e) {
  let { to: t, replace: r, state: n, relative: a } = e;
  ke() || O(!1);
  let { future: l, static: o } = g.useContext(ge),
    { matches: d } = g.useContext(de),
    { pathname: u } = He(),
    f = Cr(),
    p = wt(t, yt(d, l.v7_relativeSplatPath), u, a === "path"),
    h = JSON.stringify(p);
  return (
    g.useEffect(
      () => f(JSON.parse(h), { replace: r, state: n, relative: a }),
      [f, h, a, r, n],
    ),
    null
  );
}
function Ba(e) {
  return qn(e.context);
}
function ha(e) {
  let {
    basename: t = "/",
    children: r = null,
    location: n,
    navigationType: a = Q.Pop,
    navigator: l,
    static: o = !1,
    future: d,
  } = e;
  ke() && O(!1);
  let u = t.replace(/^\/*/, "/"),
    f = g.useMemo(
      () => ({
        basename: u,
        navigator: l,
        static: o,
        future: gt({ v7_relativeSplatPath: !1 }, d),
      }),
      [u, d, l, o],
    );
  typeof n == "string" && (n = Ee(n));
  let {
      pathname: p = "/",
      search: h = "",
      hash: y = "",
      state: w = null,
      key: S = "default",
    } = n,
    R = g.useMemo(() => {
      let M = ve(p, u);
      return M == null
        ? null
        : {
            location: { pathname: M, search: h, hash: y, state: w, key: S },
            navigationType: a,
          };
    }, [u, p, h, y, w, S, a]);
  return R == null
    ? null
    : g.createElement(
        ge.Provider,
        { value: f },
        g.createElement(jt.Provider, { children: r, value: R }),
      );
}
new Promise(() => {});
function ma(e) {
  let t = {
    hasErrorBoundary: e.ErrorBoundary != null || e.errorElement != null,
  };
  return (
    e.Component &&
      Object.assign(t, {
        element: g.createElement(e.Component),
        Component: void 0,
      }),
    e.HydrateFallback &&
      Object.assign(t, {
        hydrateFallbackElement: g.createElement(e.HydrateFallback),
        HydrateFallback: void 0,
      }),
    e.ErrorBoundary &&
      Object.assign(t, {
        errorElement: g.createElement(e.ErrorBoundary),
        ErrorBoundary: void 0,
      }),
    t
  );
}
/**
 * React Router DOM v6.30.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function ze() {
  return (
    (ze = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var r = arguments[t];
            for (var n in r)
              Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
          }
          return e;
        }),
    ze.apply(this, arguments)
  );
}
function Ur(e, t) {
  if (e == null) return {};
  var r = {},
    n = Object.keys(e),
    a,
    l;
  for (l = 0; l < n.length; l++)
    ((a = n[l]), !(t.indexOf(a) >= 0) && (r[a] = e[a]));
  return r;
}
function pa(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function va(e, t) {
  return e.button === 0 && (!t || t === "_self") && !pa(e);
}
const ga = [
    "onClick",
    "relative",
    "reloadDocument",
    "replace",
    "state",
    "target",
    "to",
    "preventScrollReset",
    "viewTransition",
  ],
  ya = [
    "aria-current",
    "caseSensitive",
    "className",
    "end",
    "style",
    "to",
    "viewTransition",
    "children",
  ],
  wa = "6";
try {
  window.__reactRouterVersion = wa;
} catch (e) {}
function za(e, t) {
  return Tn({
    basename: void 0,
    future: ze({}, void 0, { v7_prependBasename: !0 }),
    history: Zr({ window: void 0 }),
    hydrationData: ba(),
    routes: e,
    mapRouteProperties: ma,
    dataStrategy: void 0,
    patchRoutesOnNavigation: void 0,
    window: void 0,
  }).initialize();
}
function ba() {
  var e;
  let t = (e = window) == null ? void 0 : e.__staticRouterHydrationData;
  return (t && t.errors && (t = ze({}, t, { errors: Ra(t.errors) })), t);
}
function Ra(e) {
  if (!e) return null;
  let t = Object.entries(e),
    r = {};
  for (let [n, a] of t)
    if (a && a.__type === "RouteErrorResponse")
      r[n] = new vt(a.status, a.statusText, a.data, a.internal === !0);
    else if (a && a.__type === "Error") {
      if (a.__subType) {
        let l = window[a.__subType];
        if (typeof l == "function")
          try {
            let o = new l(a.message);
            ((o.stack = ""), (r[n] = o));
          } catch (o) {}
      }
      if (r[n] == null) {
        let l = new Error(a.message);
        ((l.stack = ""), (r[n] = l));
      }
    } else r[n] = a;
  return r;
}
const Fr = g.createContext({ isTransitioning: !1 }),
  Ea = g.createContext(new Map()),
  xa = "startTransition",
  hr = Xr[xa],
  Sa = "flushSync",
  mr = Qr[Sa];
function Pa(e) {
  hr ? hr(e) : e();
}
function Qe(e) {
  mr ? mr(e) : e();
}
class La {
  constructor() {
    ((this.status = "pending"),
      (this.promise = new Promise((t, r) => {
        ((this.resolve = (n) => {
          this.status === "pending" && ((this.status = "resolved"), t(n));
        }),
          (this.reject = (n) => {
            this.status === "pending" && ((this.status = "rejected"), r(n));
          }));
      })));
  }
}
function ka(e) {
  let { fallbackElement: t, router: r, future: n } = e,
    [a, l] = g.useState(r.state),
    [o, d] = g.useState(),
    [u, f] = g.useState({ isTransitioning: !1 }),
    [p, h] = g.useState(),
    [y, w] = g.useState(),
    [S, R] = g.useState(),
    M = g.useRef(new Map()),
    { v7_startTransition: I } = n || {},
    L = g.useCallback(
      (T) => {
        I ? Pa(T) : T();
      },
      [I],
    ),
    N = g.useCallback(
      (T, H) => {
        let { deletedFetchers: _, flushSync: Z, viewTransitionOpts: G } = H;
        (T.fetchers.forEach((re, ce) => {
          re.data !== void 0 && M.current.set(ce, re.data);
        }),
          _.forEach((re) => M.current.delete(re)));
        let ae =
          r.window == null ||
          r.window.document == null ||
          typeof r.window.document.startViewTransition != "function";
        if (!G || ae) {
          Z ? Qe(() => l(T)) : L(() => l(T));
          return;
        }
        if (Z) {
          Qe(() => {
            (y && (p && p.resolve(), y.skipTransition()),
              f({
                isTransitioning: !0,
                flushSync: !0,
                currentLocation: G.currentLocation,
                nextLocation: G.nextLocation,
              }));
          });
          let re = r.window.document.startViewTransition(() => {
            Qe(() => l(T));
          });
          (re.finished.finally(() => {
            Qe(() => {
              (h(void 0), w(void 0), d(void 0), f({ isTransitioning: !1 }));
            });
          }),
            Qe(() => w(re)));
          return;
        }
        y
          ? (p && p.resolve(),
            y.skipTransition(),
            R({
              state: T,
              currentLocation: G.currentLocation,
              nextLocation: G.nextLocation,
            }))
          : (d(T),
            f({
              isTransitioning: !0,
              flushSync: !1,
              currentLocation: G.currentLocation,
              nextLocation: G.nextLocation,
            }));
      },
      [r.window, y, p, M, L],
    );
  (g.useLayoutEffect(() => r.subscribe(N), [r, N]),
    g.useEffect(() => {
      u.isTransitioning && !u.flushSync && h(new La());
    }, [u]),
    g.useEffect(() => {
      if (p && o && r.window) {
        let T = o,
          H = p.promise,
          _ = r.window.document.startViewTransition(() =>
            K(this, null, function* () {
              (L(() => l(T)), yield H);
            }),
          );
        (_.finished.finally(() => {
          (h(void 0), w(void 0), d(void 0), f({ isTransitioning: !1 }));
        }),
          w(_));
      }
    }, [L, o, p, r.window]),
    g.useEffect(() => {
      p && o && a.location.key === o.location.key && p.resolve();
    }, [p, y, a.location, o]),
    g.useEffect(() => {
      !u.isTransitioning &&
        S &&
        (d(S.state),
        f({
          isTransitioning: !0,
          flushSync: !1,
          currentLocation: S.currentLocation,
          nextLocation: S.nextLocation,
        }),
        R(void 0));
    }, [u.isTransitioning, S]),
    g.useEffect(() => {}, []));
  let A = g.useMemo(
      () => ({
        createHref: r.createHref,
        encodeLocation: r.encodeLocation,
        go: (T) => r.navigate(T),
        push: (T, H, _) =>
          r.navigate(T, {
            state: H,
            preventScrollReset: _ == null ? void 0 : _.preventScrollReset,
          }),
        replace: (T, H, _) =>
          r.navigate(T, {
            replace: !0,
            state: H,
            preventScrollReset: _ == null ? void 0 : _.preventScrollReset,
          }),
      }),
      [r],
    ),
    $ = r.basename || "/",
    oe = g.useMemo(
      () => ({ router: r, navigator: A, static: !1, basename: $ }),
      [r, A, $],
    ),
    m = g.useMemo(
      () => ({ v7_relativeSplatPath: r.future.v7_relativeSplatPath }),
      [r.future.v7_relativeSplatPath],
    );
  return (
    g.useEffect(() => fa(n, r.future), [n, r.future]),
    g.createElement(
      g.Fragment,
      null,
      g.createElement(
        tt.Provider,
        { value: oe },
        g.createElement(
          Nt.Provider,
          { value: a },
          g.createElement(
            Ea.Provider,
            { value: M.current },
            g.createElement(
              Fr.Provider,
              { value: u },
              g.createElement(
                ha,
                {
                  basename: $,
                  location: a.location,
                  navigationType: a.historyAction,
                  navigator: A,
                  future: m,
                },
                a.initialized || r.future.v7_partialHydration
                  ? g.createElement(Ca, {
                      routes: r.routes,
                      future: r.future,
                      state: a,
                    })
                  : t,
              ),
            ),
          ),
        ),
      ),
      null,
    )
  );
}
const Ca = g.memo(Da);
function Da(e) {
  let { routes: t, future: r, state: n } = e;
  return ea(t, void 0, n, r);
}
const Ma =
    typeof window != "undefined" &&
    typeof window.document != "undefined" &&
    typeof window.document.createElement != "undefined",
  Ta = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  Ua = g.forwardRef(function (t, r) {
    let {
        onClick: n,
        relative: a,
        reloadDocument: l,
        replace: o,
        state: d,
        target: u,
        to: f,
        preventScrollReset: p,
        viewTransition: h,
      } = t,
      y = Ur(t, ga),
      { basename: w } = g.useContext(ge),
      S,
      R = !1;
    if (typeof f == "string" && Ta.test(f) && ((S = f), Ma))
      try {
        let N = new URL(window.location.href),
          A = f.startsWith("//") ? new URL(N.protocol + f) : new URL(f),
          $ = ve(A.pathname, w);
        A.origin === N.origin && $ != null
          ? (f = $ + A.search + A.hash)
          : (R = !0);
      } catch (N) {}
    let M = Xn(f, { relative: a }),
      I = _a(f, {
        replace: o,
        state: d,
        target: u,
        preventScrollReset: p,
        relative: a,
        viewTransition: h,
      });
    function L(N) {
      (n && n(N), N.defaultPrevented || I(N));
    }
    return g.createElement(
      "a",
      ze({}, y, { href: S || M, onClick: R || l ? n : L, ref: r, target: u }),
    );
  }),
  Ha = g.forwardRef(function (t, r) {
    let {
        "aria-current": n = "page",
        caseSensitive: a = !1,
        className: l = "",
        end: o = !1,
        style: d,
        to: u,
        viewTransition: f,
        children: p,
      } = t,
      h = Ur(t, ya),
      y = bt(u, { relative: h.relative }),
      w = He(),
      S = g.useContext(Nt),
      { navigator: R, basename: M } = g.useContext(ge),
      I = S != null && Oa(y) && f === !0,
      L = R.encodeLocation ? R.encodeLocation(y).pathname : y.pathname,
      N = w.pathname,
      A =
        S && S.navigation && S.navigation.location
          ? S.navigation.location.pathname
          : null;
    (a ||
      ((N = N.toLowerCase()),
      (A = A ? A.toLowerCase() : null),
      (L = L.toLowerCase())),
      A && M && (A = ve(A, M) || A));
    const $ = L !== "/" && L.endsWith("/") ? L.length - 1 : L.length;
    let oe = N === L || (!o && N.startsWith(L) && N.charAt($) === "/"),
      m =
        A != null &&
        (A === L || (!o && A.startsWith(L) && A.charAt(L.length) === "/")),
      T = { isActive: oe, isPending: m, isTransitioning: I },
      H = oe ? n : void 0,
      _;
    typeof l == "function"
      ? (_ = l(T))
      : (_ = [
          l,
          oe ? "active" : null,
          m ? "pending" : null,
          I ? "transitioning" : null,
        ]
          .filter(Boolean)
          .join(" "));
    let Z = typeof d == "function" ? d(T) : d;
    return g.createElement(
      Ua,
      ze({}, h, {
        "aria-current": H,
        className: _,
        ref: r,
        style: Z,
        to: u,
        viewTransition: f,
      }),
      typeof p == "function" ? p(T) : p,
    );
  });
var Ut;
(function (e) {
  ((e.UseScrollRestoration = "useScrollRestoration"),
    (e.UseSubmit = "useSubmit"),
    (e.UseSubmitFetcher = "useSubmitFetcher"),
    (e.UseFetcher = "useFetcher"),
    (e.useViewTransitionState = "useViewTransitionState"));
})(Ut || (Ut = {}));
var pr;
(function (e) {
  ((e.UseFetcher = "useFetcher"),
    (e.UseFetchers = "useFetchers"),
    (e.UseScrollRestoration = "useScrollRestoration"));
})(pr || (pr = {}));
function Fa(e) {
  let t = g.useContext(tt);
  return (t || O(!1), t);
}
function _a(e, t) {
  let {
      target: r,
      replace: n,
      state: a,
      preventScrollReset: l,
      relative: o,
      viewTransition: d,
    } = t === void 0 ? {} : t,
    u = Cr(),
    f = He(),
    p = bt(e, { relative: o });
  return g.useCallback(
    (h) => {
      if (va(h, r)) {
        h.preventDefault();
        let y = n !== void 0 ? n : Fe(f) === Fe(p);
        u(e, {
          replace: y,
          state: a,
          preventScrollReset: l,
          relative: o,
          viewTransition: d,
        });
      }
    },
    [f, u, p, n, a, r, e, l, o, d],
  );
}
function Oa(e, t) {
  t === void 0 && (t = {});
  let r = g.useContext(Fr);
  r == null && O(!1);
  let { basename: n } = Fa(Ut.useViewTransitionState),
    a = bt(e, { relative: t.relative });
  if (!r.isTransitioning) return !1;
  let l = ve(r.currentLocation.pathname, n) || r.currentLocation.pathname,
    o = ve(r.nextLocation.pathname, n) || r.nextLocation.pathname;
  return pt(a.pathname, o) != null || pt(a.pathname, l) != null;
}
export {
  Ua as L,
  Aa as N,
  Ba as O,
  ka as R,
  Cr as a,
  Ia as b,
  Ha as c,
  za as d,
  He as u,
};
