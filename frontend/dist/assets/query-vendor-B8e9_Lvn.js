var hs = Object.defineProperty,
  cs = Object.defineProperties;
var ls = Object.getOwnPropertyDescriptors;
var Jt = Object.getOwnPropertySymbols;
var we = Object.prototype.hasOwnProperty,
  Re = Object.prototype.propertyIsEnumerable;
var Pe = (e) => {
    throw TypeError(e);
  },
  Fe = Math.pow,
  Oe = (e, t, s) =>
    t in e
      ? hs(e, t, { enumerable: !0, configurable: !0, writable: !0, value: s })
      : (e[t] = s),
  f = (e, t) => {
    for (var s in t || (t = {})) we.call(t, s) && Oe(e, s, t[s]);
    if (Jt) for (var s of Jt(t)) Re.call(t, s) && Oe(e, s, t[s]);
    return e;
  },
  P = (e, t) => cs(e, ls(t));
var Ee = (e, t) => {
  var s = {};
  for (var i in e) we.call(e, i) && t.indexOf(i) < 0 && (s[i] = e[i]);
  if (e != null && Jt)
    for (var i of Jt(e)) t.indexOf(i) < 0 && Re.call(e, i) && (s[i] = e[i]);
  return s;
};
var se = (e, t, s) => t.has(e) || Pe("Cannot " + s);
var r = (e, t, s) => (
    se(e, t, "read from private field"),
    s ? s.call(e) : t.get(e)
  ),
  c = (e, t, s) =>
    t.has(e)
      ? Pe("Cannot add the same private member more than once")
      : t instanceof WeakSet
        ? t.add(e)
        : t.set(e, s),
  o = (e, t, s, i) => (
    se(e, t, "write to private field"),
    i ? i.call(e, s) : t.set(e, s),
    s
  ),
  p = (e, t, s) => (se(e, t, "access private method"), s);
var Zt = (e, t, s, i) => ({
  set _(n) {
    o(e, t, n, s);
  },
  get _() {
    return r(e, t, i);
  },
});
var mt = (e, t, s) =>
  new Promise((i, n) => {
    var a = (l) => {
        try {
          h(s.next(l));
        } catch (m) {
          n(m);
        }
      },
      u = (l) => {
        try {
          h(s.throw(l));
        } catch (m) {
          n(m);
        }
      },
      h = (l) => (l.done ? i(l.value) : Promise.resolve(l.value).then(a, u));
    h((s = s.apply(e, t)).next());
  });
import { r as U } from "./chart-vendor-C7uCl44m.js";
import { j as ds } from "./feature-admin-Bw8S4RZv.js";
var kt = class {
    constructor() {
      ((this.listeners = new Set()),
        (this.subscribe = this.subscribe.bind(this)));
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        this.onSubscribe(),
        () => {
          (this.listeners.delete(e), this.onUnsubscribe());
        }
      );
    }
    hasListeners() {
      return this.listeners.size > 0;
    }
    onSubscribe() {}
    onUnsubscribe() {}
  },
  fs = {
    setTimeout: (e, t) => setTimeout(e, t),
    clearTimeout: (e) => clearTimeout(e),
    setInterval: (e, t) => setInterval(e, t),
    clearInterval: (e) => clearInterval(e),
  },
  nt,
  ve,
  Le,
  ys =
    ((Le = class {
      constructor() {
        c(this, nt, fs);
        c(this, ve, !1);
      }
      setTimeoutProvider(e) {
        o(this, nt, e);
      }
      setTimeout(e, t) {
        return r(this, nt).setTimeout(e, t);
      }
      clearTimeout(e) {
        r(this, nt).clearTimeout(e);
      }
      setInterval(e, t) {
        return r(this, nt).setInterval(e, t);
      }
      clearInterval(e) {
        r(this, nt).clearInterval(e);
      }
    }),
    (nt = new WeakMap()),
    (ve = new WeakMap()),
    Le),
  vt = new ys();
function ps(e) {
  setTimeout(e, 0);
}
var Et = typeof window == "undefined" || "Deno" in globalThis;
function _() {}
function ms(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function ie(e) {
  return typeof e == "number" && e >= 0 && e !== 1 / 0;
}
function Je(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0);
}
function yt(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function z(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Me(e, t) {
  const {
    type: s = "all",
    exact: i,
    fetchStatus: n,
    predicate: a,
    queryKey: u,
    stale: h,
  } = e;
  if (u) {
    if (i) {
      if (t.queryHash !== be(u, t.options)) return !1;
    } else if (!Nt(t.queryKey, u)) return !1;
  }
  if (s !== "all") {
    const l = t.isActive();
    if ((s === "active" && !l) || (s === "inactive" && l)) return !1;
  }
  return !(
    (typeof h == "boolean" && t.isStale() !== h) ||
    (n && n !== t.state.fetchStatus) ||
    (a && !a(t))
  );
}
function Qe(e, t) {
  const { exact: s, status: i, predicate: n, mutationKey: a } = e;
  if (a) {
    if (!t.options.mutationKey) return !1;
    if (s) {
      if (Mt(t.options.mutationKey) !== Mt(a)) return !1;
    } else if (!Nt(t.options.mutationKey, a)) return !1;
  }
  return !((i && t.state.status !== i) || (n && !n(t)));
}
function be(e, t) {
  return ((t == null ? void 0 : t.queryKeyHashFn) || Mt)(e);
}
function Mt(e) {
  return JSON.stringify(e, (t, s) =>
    re(s)
      ? Object.keys(s)
          .sort()
          .reduce((i, n) => ((i[n] = s[n]), i), {})
      : s,
  );
}
function Nt(e, t) {
  return e === t
    ? !0
    : typeof e != typeof t
      ? !1
      : e && t && typeof e == "object" && typeof t == "object"
        ? Object.keys(t).every((s) => Nt(e[s], t[s]))
        : !1;
}
var vs = Object.prototype.hasOwnProperty;
function Ze(e, t) {
  if (e === t) return e;
  const s = Ie(e) && Ie(t);
  if (!s && !(re(e) && re(t))) return t;
  const n = (s ? e : Object.keys(e)).length,
    a = s ? t : Object.keys(t),
    u = a.length,
    h = s ? new Array(u) : {};
  let l = 0;
  for (let m = 0; m < u; m++) {
    const S = s ? m : a[m],
      y = e[S],
      w = t[S];
    if (y === w) {
      ((h[S] = y), (s ? m < n : vs.call(e, S)) && l++);
      continue;
    }
    if (
      y === null ||
      w === null ||
      typeof y != "object" ||
      typeof w != "object"
    ) {
      h[S] = w;
      continue;
    }
    const b = Ze(y, w);
    ((h[S] = b), b === y && l++);
  }
  return n === u && l === n ? e : h;
}
function te(e, t) {
  if (!t || Object.keys(e).length !== Object.keys(t).length) return !1;
  for (const s in e) if (e[s] !== t[s]) return !1;
  return !0;
}
function Ie(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function re(e) {
  if (!Te(e)) return !1;
  const t = e.constructor;
  if (t === void 0) return !0;
  const s = t.prototype;
  return !(
    !Te(s) ||
    !s.hasOwnProperty("isPrototypeOf") ||
    Object.getPrototypeOf(e) !== Object.prototype
  );
}
function Te(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
function bs(e) {
  return new Promise((t) => {
    vt.setTimeout(t, e);
  });
}
function ne(e, t, s) {
  return typeof s.structuralSharing == "function"
    ? s.structuralSharing(e, t)
    : s.structuralSharing !== !1
      ? Ze(e, t)
      : t;
}
function gs(e, t, s = 0) {
  const i = [...e, t];
  return s && i.length > s ? i.slice(1) : i;
}
function Cs(e, t, s = 0) {
  const i = [t, ...e];
  return s && i.length > s ? i.slice(0, -1) : i;
}
var ge = Symbol();
function Xe(e, t) {
  return !e.queryFn && t != null && t.initialPromise
    ? () => t.initialPromise
    : !e.queryFn || e.queryFn === ge
      ? () => Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`))
      : e.queryFn;
}
function Ye(e, t) {
  return typeof e == "function" ? e(...t) : !!e;
}
var bt,
  at,
  Qt,
  _e,
  Ss =
    ((_e = class extends kt {
      constructor() {
        super();
        c(this, bt);
        c(this, at);
        c(this, Qt);
        o(this, Qt, (t) => {
          if (!Et && window.addEventListener) {
            const s = () => t();
            return (
              window.addEventListener("visibilitychange", s, !1),
              () => {
                window.removeEventListener("visibilitychange", s);
              }
            );
          }
        });
      }
      onSubscribe() {
        r(this, at) || this.setEventListener(r(this, Qt));
      }
      onUnsubscribe() {
        var t;
        this.hasListeners() ||
          ((t = r(this, at)) == null || t.call(this), o(this, at, void 0));
      }
      setEventListener(t) {
        var s;
        (o(this, Qt, t),
          (s = r(this, at)) == null || s.call(this),
          o(
            this,
            at,
            t((i) => {
              typeof i == "boolean" ? this.setFocused(i) : this.onFocus();
            }),
          ));
      }
      setFocused(t) {
        r(this, bt) !== t && (o(this, bt, t), this.onFocus());
      }
      onFocus() {
        const t = this.isFocused();
        this.listeners.forEach((s) => {
          s(t);
        });
      }
      isFocused() {
        var t;
        return typeof r(this, bt) == "boolean"
          ? r(this, bt)
          : ((t = globalThis.document) == null ? void 0 : t.visibilityState) !==
              "hidden";
      }
    }),
    (bt = new WeakMap()),
    (at = new WeakMap()),
    (Qt = new WeakMap()),
    _e),
  Ce = new Ss();
function ae() {
  let e, t;
  const s = new Promise((n, a) => {
    ((e = n), (t = a));
  });
  ((s.status = "pending"), s.catch(() => {}));
  function i(n) {
    (Object.assign(s, n), delete s.resolve, delete s.reject);
  }
  return (
    (s.resolve = (n) => {
      (i({ status: "fulfilled", value: n }), e(n));
    }),
    (s.reject = (n) => {
      (i({ status: "rejected", reason: n }), t(n));
    }),
    s
  );
}
var Os = ps;
function ws() {
  let e = [],
    t = 0,
    s = (h) => {
      h();
    },
    i = (h) => {
      h();
    },
    n = Os;
  const a = (h) => {
      t
        ? e.push(h)
        : n(() => {
            s(h);
          });
    },
    u = () => {
      const h = e;
      ((e = []),
        h.length &&
          n(() => {
            i(() => {
              h.forEach((l) => {
                s(l);
              });
            });
          }));
    };
  return {
    batch: (h) => {
      let l;
      t++;
      try {
        l = h();
      } finally {
        (t--, t || u());
      }
      return l;
    },
    batchCalls:
      (h) =>
      (...l) => {
        a(() => {
          h(...l);
        });
      },
    schedule: a,
    setNotifyFunction: (h) => {
      s = h;
    },
    setBatchNotifyFunction: (h) => {
      i = h;
    },
    setScheduler: (h) => {
      n = h;
    },
  };
}
var Q = ws(),
  It,
  ot,
  Tt,
  ke,
  Rs =
    ((ke = class extends kt {
      constructor() {
        super();
        c(this, It, !0);
        c(this, ot);
        c(this, Tt);
        o(this, Tt, (t) => {
          if (!Et && window.addEventListener) {
            const s = () => t(!0),
              i = () => t(!1);
            return (
              window.addEventListener("online", s, !1),
              window.addEventListener("offline", i, !1),
              () => {
                (window.removeEventListener("online", s),
                  window.removeEventListener("offline", i));
              }
            );
          }
        });
      }
      onSubscribe() {
        r(this, ot) || this.setEventListener(r(this, Tt));
      }
      onUnsubscribe() {
        var t;
        this.hasListeners() ||
          ((t = r(this, ot)) == null || t.call(this), o(this, ot, void 0));
      }
      setEventListener(t) {
        var s;
        (o(this, Tt, t),
          (s = r(this, ot)) == null || s.call(this),
          o(this, ot, t(this.setOnline.bind(this))));
      }
      setOnline(t) {
        r(this, It) !== t &&
          (o(this, It, t),
          this.listeners.forEach((i) => {
            i(t);
          }));
      }
      isOnline() {
        return r(this, It);
      }
    }),
    (It = new WeakMap()),
    (ot = new WeakMap()),
    (Tt = new WeakMap()),
    ke),
  ee = new Rs();
function Ps(e) {
  return Math.min(1e3 * Fe(2, e), 3e4);
}
function ts(e) {
  return (e != null ? e : "online") === "online" ? ee.isOnline() : !0;
}
var oe = class extends Error {
  constructor(e) {
    (super("CancelledError"),
      (this.revert = e == null ? void 0 : e.revert),
      (this.silent = e == null ? void 0 : e.silent));
  }
};
function es(e) {
  let t = !1,
    s = 0,
    i;
  const n = ae(),
    a = () => n.status !== "pending",
    u = (C) => {
      var g;
      if (!a()) {
        const R = new oe(C);
        (w(R), (g = e.onCancel) == null || g.call(e, R));
      }
    },
    h = () => {
      t = !0;
    },
    l = () => {
      t = !1;
    },
    m = () =>
      Ce.isFocused() &&
      (e.networkMode === "always" || ee.isOnline()) &&
      e.canRun(),
    S = () => ts(e.networkMode) && e.canRun(),
    y = (C) => {
      a() || (i == null || i(), n.resolve(C));
    },
    w = (C) => {
      a() || (i == null || i(), n.reject(C));
    },
    b = () =>
      new Promise((C) => {
        var g;
        ((i = (R) => {
          (a() || m()) && C(R);
        }),
          (g = e.onPause) == null || g.call(e));
      }).then(() => {
        var C;
        ((i = void 0), a() || (C = e.onContinue) == null || C.call(e));
      }),
    I = () => {
      if (a()) return;
      let C;
      const g = s === 0 ? e.initialPromise : void 0;
      try {
        C = g != null ? g : e.fn();
      } catch (R) {
        C = Promise.reject(R);
      }
      Promise.resolve(C)
        .then(y)
        .catch((R) => {
          var q, B, x;
          if (a()) return;
          const T = (q = e.retry) != null ? q : Et ? 0 : 3,
            j = (B = e.retryDelay) != null ? B : Ps,
            d = typeof j == "function" ? j(s, R) : j,
            M =
              T === !0 ||
              (typeof T == "number" && s < T) ||
              (typeof T == "function" && T(s, R));
          if (t || !M) {
            w(R);
            return;
          }
          (s++,
            (x = e.onFail) == null || x.call(e, s, R),
            bs(d)
              .then(() => (m() ? void 0 : b()))
              .then(() => {
                t ? w(R) : I();
              }));
        });
    };
  return {
    promise: n,
    status: () => n.status,
    cancel: u,
    continue: () => (i == null || i(), n),
    cancelRetry: h,
    continueRetry: l,
    canStart: S,
    start: () => (S() ? I() : b().then(I), n),
  };
}
var gt,
  He,
  ss =
    ((He = class {
      constructor() {
        c(this, gt);
      }
      destroy() {
        this.clearGcTimeout();
      }
      scheduleGc() {
        (this.clearGcTimeout(),
          ie(this.gcTime) &&
            o(
              this,
              gt,
              vt.setTimeout(() => {
                this.optionalRemove();
              }, this.gcTime),
            ));
      }
      updateGcTime(e) {
        this.gcTime = Math.max(
          this.gcTime || 0,
          e != null ? e : Et ? 1 / 0 : 5 * 60 * 1e3,
        );
      }
      clearGcTimeout() {
        r(this, gt) && (vt.clearTimeout(r(this, gt)), o(this, gt, void 0));
      }
    }),
    (gt = new WeakMap()),
    He),
  Ct,
  xt,
  G,
  St,
  A,
  Bt,
  Ot,
  W,
  X,
  Ne,
  Fs =
    ((Ne = class extends ss {
      constructor(t) {
        var s;
        super();
        c(this, W);
        c(this, Ct);
        c(this, xt);
        c(this, G);
        c(this, St);
        c(this, A);
        c(this, Bt);
        c(this, Ot);
        (o(this, Ot, !1),
          o(this, Bt, t.defaultOptions),
          this.setOptions(t.options),
          (this.observers = []),
          o(this, St, t.client),
          o(this, G, r(this, St).getQueryCache()),
          (this.queryKey = t.queryKey),
          (this.queryHash = t.queryHash),
          o(this, Ct, De(this.options)),
          (this.state = (s = t.state) != null ? s : r(this, Ct)),
          this.scheduleGc());
      }
      get meta() {
        return this.options.meta;
      }
      get promise() {
        var t;
        return (t = r(this, A)) == null ? void 0 : t.promise;
      }
      setOptions(t) {
        if (
          ((this.options = f(f({}, r(this, Bt)), t)),
          this.updateGcTime(this.options.gcTime),
          this.state && this.state.data === void 0)
        ) {
          const s = De(this.options);
          s.data !== void 0 &&
            (this.setState(xe(s.data, s.dataUpdatedAt)), o(this, Ct, s));
        }
      }
      optionalRemove() {
        !this.observers.length &&
          this.state.fetchStatus === "idle" &&
          r(this, G).remove(this);
      }
      setData(t, s) {
        const i = ne(this.state.data, t, this.options);
        return (
          p(this, W, X).call(this, {
            data: i,
            type: "success",
            dataUpdatedAt: s == null ? void 0 : s.updatedAt,
            manual: s == null ? void 0 : s.manual,
          }),
          i
        );
      }
      setState(t, s) {
        p(this, W, X).call(this, {
          type: "setState",
          state: t,
          setStateOptions: s,
        });
      }
      cancel(t) {
        var i, n;
        const s = (i = r(this, A)) == null ? void 0 : i.promise;
        return (
          (n = r(this, A)) == null || n.cancel(t),
          s ? s.then(_).catch(_) : Promise.resolve()
        );
      }
      destroy() {
        (super.destroy(), this.cancel({ silent: !0 }));
      }
      reset() {
        (this.destroy(), this.setState(r(this, Ct)));
      }
      isActive() {
        return this.observers.some((t) => z(t.options.enabled, this) !== !1);
      }
      isDisabled() {
        return this.getObserversCount() > 0
          ? !this.isActive()
          : this.options.queryFn === ge ||
              this.state.dataUpdateCount + this.state.errorUpdateCount === 0;
      }
      isStatic() {
        return this.getObserversCount() > 0
          ? this.observers.some(
              (t) => yt(t.options.staleTime, this) === "static",
            )
          : !1;
      }
      isStale() {
        return this.getObserversCount() > 0
          ? this.observers.some((t) => t.getCurrentResult().isStale)
          : this.state.data === void 0 || this.state.isInvalidated;
      }
      isStaleByTime(t = 0) {
        return this.state.data === void 0
          ? !0
          : t === "static"
            ? !1
            : this.state.isInvalidated
              ? !0
              : !Je(this.state.dataUpdatedAt, t);
      }
      onFocus() {
        var s;
        const t = this.observers.find((i) => i.shouldFetchOnWindowFocus());
        (t == null || t.refetch({ cancelRefetch: !1 }),
          (s = r(this, A)) == null || s.continue());
      }
      onOnline() {
        var s;
        const t = this.observers.find((i) => i.shouldFetchOnReconnect());
        (t == null || t.refetch({ cancelRefetch: !1 }),
          (s = r(this, A)) == null || s.continue());
      }
      addObserver(t) {
        this.observers.includes(t) ||
          (this.observers.push(t),
          this.clearGcTimeout(),
          r(this, G).notify({
            type: "observerAdded",
            query: this,
            observer: t,
          }));
      }
      removeObserver(t) {
        this.observers.includes(t) &&
          ((this.observers = this.observers.filter((s) => s !== t)),
          this.observers.length ||
            (r(this, A) &&
              (r(this, Ot)
                ? r(this, A).cancel({ revert: !0 })
                : r(this, A).cancelRetry()),
            this.scheduleGc()),
          r(this, G).notify({
            type: "observerRemoved",
            query: this,
            observer: t,
          }));
      }
      getObserversCount() {
        return this.observers.length;
      }
      invalidate() {
        this.state.isInvalidated ||
          p(this, W, X).call(this, { type: "invalidate" });
      }
      fetch(t, s) {
        return mt(this, null, function* () {
          var l, m, S, y, w, b, I, C, g, R, T, j;
          if (
            this.state.fetchStatus !== "idle" &&
            ((l = r(this, A)) == null ? void 0 : l.status()) !== "rejected"
          ) {
            if (this.state.data !== void 0 && s != null && s.cancelRefetch)
              this.cancel({ silent: !0 });
            else if (r(this, A))
              return (r(this, A).continueRetry(), r(this, A).promise);
          }
          if ((t && this.setOptions(t), !this.options.queryFn)) {
            const d = this.observers.find((M) => M.options.queryFn);
            d && this.setOptions(d.options);
          }
          const i = new AbortController(),
            n = (d) => {
              Object.defineProperty(d, "signal", {
                enumerable: !0,
                get: () => (o(this, Ot, !0), i.signal),
              });
            },
            a = () => {
              const d = Xe(this.options, s),
                q = (() => {
                  const B = {
                    client: r(this, St),
                    queryKey: this.queryKey,
                    meta: this.meta,
                  };
                  return (n(B), B);
                })();
              return (
                o(this, Ot, !1),
                this.options.persister
                  ? this.options.persister(d, q, this)
                  : d(q)
              );
            },
            h = (() => {
              const d = {
                fetchOptions: s,
                options: this.options,
                queryKey: this.queryKey,
                client: r(this, St),
                state: this.state,
                fetchFn: a,
              };
              return (n(d), d);
            })();
          ((m = this.options.behavior) == null || m.onFetch(h, this),
            o(this, xt, this.state),
            (this.state.fetchStatus === "idle" ||
              this.state.fetchMeta !==
                ((S = h.fetchOptions) == null ? void 0 : S.meta)) &&
              p(this, W, X).call(this, {
                type: "fetch",
                meta: (y = h.fetchOptions) == null ? void 0 : y.meta,
              }),
            o(
              this,
              A,
              es({
                initialPromise: s == null ? void 0 : s.initialPromise,
                fn: h.fetchFn,
                onCancel: (d) => {
                  (d instanceof oe &&
                    d.revert &&
                    this.setState(
                      P(f({}, r(this, xt)), { fetchStatus: "idle" }),
                    ),
                    i.abort());
                },
                onFail: (d, M) => {
                  p(this, W, X).call(this, {
                    type: "failed",
                    failureCount: d,
                    error: M,
                  });
                },
                onPause: () => {
                  p(this, W, X).call(this, { type: "pause" });
                },
                onContinue: () => {
                  p(this, W, X).call(this, { type: "continue" });
                },
                retry: h.options.retry,
                retryDelay: h.options.retryDelay,
                networkMode: h.options.networkMode,
                canRun: () => !0,
              }),
            ));
          try {
            const d = yield r(this, A).start();
            if (d === void 0)
              throw new Error(`${this.queryHash} data is undefined`);
            return (
              this.setData(d),
              (b = (w = r(this, G).config).onSuccess) == null ||
                b.call(w, d, this),
              (C = (I = r(this, G).config).onSettled) == null ||
                C.call(I, d, this.state.error, this),
              d
            );
          } catch (d) {
            if (d instanceof oe) {
              if (d.silent) return r(this, A).promise;
              if (d.revert) {
                if (this.state.data === void 0) throw d;
                return this.state.data;
              }
            }
            throw (
              p(this, W, X).call(this, { type: "error", error: d }),
              (R = (g = r(this, G).config).onError) == null ||
                R.call(g, d, this),
              (j = (T = r(this, G).config).onSettled) == null ||
                j.call(T, this.state.data, d, this),
              d
            );
          } finally {
            this.scheduleGc();
          }
        });
      }
    }),
    (Ct = new WeakMap()),
    (xt = new WeakMap()),
    (G = new WeakMap()),
    (St = new WeakMap()),
    (A = new WeakMap()),
    (Bt = new WeakMap()),
    (Ot = new WeakMap()),
    (W = new WeakSet()),
    (X = function (t) {
      const s = (i) => {
        var n;
        switch (t.type) {
          case "failed":
            return P(f({}, i), {
              fetchFailureCount: t.failureCount,
              fetchFailureReason: t.error,
            });
          case "pause":
            return P(f({}, i), { fetchStatus: "paused" });
          case "continue":
            return P(f({}, i), { fetchStatus: "fetching" });
          case "fetch":
            return P(f(f({}, i), is(i.data, this.options)), {
              fetchMeta: (n = t.meta) != null ? n : null,
            });
          case "success":
            const a = f(
              P(f(f({}, i), xe(t.data, t.dataUpdatedAt)), {
                dataUpdateCount: i.dataUpdateCount + 1,
              }),
              !t.manual && {
                fetchStatus: "idle",
                fetchFailureCount: 0,
                fetchFailureReason: null,
              },
            );
            return (o(this, xt, t.manual ? a : void 0), a);
          case "error":
            const u = t.error;
            return P(f({}, i), {
              error: u,
              errorUpdateCount: i.errorUpdateCount + 1,
              errorUpdatedAt: Date.now(),
              fetchFailureCount: i.fetchFailureCount + 1,
              fetchFailureReason: u,
              fetchStatus: "idle",
              status: "error",
            });
          case "invalidate":
            return P(f({}, i), { isInvalidated: !0 });
          case "setState":
            return f(f({}, i), t.state);
        }
      };
      ((this.state = s(this.state)),
        Q.batch(() => {
          (this.observers.forEach((i) => {
            i.onQueryUpdate();
          }),
            r(this, G).notify({ query: this, type: "updated", action: t }));
        }));
    }),
    Ne);
function is(e, t) {
  return f(
    {
      fetchFailureCount: 0,
      fetchFailureReason: null,
      fetchStatus: ts(t.networkMode) ? "fetching" : "paused",
    },
    e === void 0 && { error: null, status: "pending" },
  );
}
function xe(e, t) {
  return {
    data: e,
    dataUpdatedAt: t != null ? t : Date.now(),
    error: null,
    isInvalidated: !1,
    status: "success",
  };
}
function De(e) {
  const t =
      typeof e.initialData == "function" ? e.initialData() : e.initialData,
    s = t !== void 0,
    i = s
      ? typeof e.initialDataUpdatedAt == "function"
        ? e.initialDataUpdatedAt()
        : e.initialDataUpdatedAt
      : 0;
  return {
    data: t,
    dataUpdateCount: 0,
    dataUpdatedAt: s ? (i != null ? i : Date.now()) : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: !1,
    status: s ? "success" : "pending",
    fetchStatus: "idle",
  };
}
var H,
  v,
  Gt,
  K,
  wt,
  Dt,
  Y,
  ut,
  zt,
  At,
  qt,
  Rt,
  Pt,
  ht,
  Ut,
  O,
  Ht,
  ue,
  he,
  ce,
  le,
  de,
  fe,
  ye,
  rs,
  Be,
  Es =
    ((Be = class extends kt {
      constructor(t, s) {
        super();
        c(this, O);
        c(this, H);
        c(this, v);
        c(this, Gt);
        c(this, K);
        c(this, wt);
        c(this, Dt);
        c(this, Y);
        c(this, ut);
        c(this, zt);
        c(this, At);
        c(this, qt);
        c(this, Rt);
        c(this, Pt);
        c(this, ht);
        c(this, Ut, new Set());
        ((this.options = s),
          o(this, H, t),
          o(this, ut, null),
          o(this, Y, ae()),
          this.bindMethods(),
          this.setOptions(s));
      }
      bindMethods() {
        this.refetch = this.refetch.bind(this);
      }
      onSubscribe() {
        this.listeners.size === 1 &&
          (r(this, v).addObserver(this),
          Ae(r(this, v), this.options)
            ? p(this, O, Ht).call(this)
            : this.updateResult(),
          p(this, O, le).call(this));
      }
      onUnsubscribe() {
        this.hasListeners() || this.destroy();
      }
      shouldFetchOnReconnect() {
        return pe(r(this, v), this.options, this.options.refetchOnReconnect);
      }
      shouldFetchOnWindowFocus() {
        return pe(r(this, v), this.options, this.options.refetchOnWindowFocus);
      }
      destroy() {
        ((this.listeners = new Set()),
          p(this, O, de).call(this),
          p(this, O, fe).call(this),
          r(this, v).removeObserver(this));
      }
      setOptions(t) {
        const s = this.options,
          i = r(this, v);
        if (
          ((this.options = r(this, H).defaultQueryOptions(t)),
          this.options.enabled !== void 0 &&
            typeof this.options.enabled != "boolean" &&
            typeof this.options.enabled != "function" &&
            typeof z(this.options.enabled, r(this, v)) != "boolean")
        )
          throw new Error(
            "Expected enabled to be a boolean or a callback that returns a boolean",
          );
        (p(this, O, ye).call(this),
          r(this, v).setOptions(this.options),
          s._defaulted &&
            !te(this.options, s) &&
            r(this, H)
              .getQueryCache()
              .notify({
                type: "observerOptionsUpdated",
                query: r(this, v),
                observer: this,
              }));
        const n = this.hasListeners();
        (n && qe(r(this, v), i, this.options, s) && p(this, O, Ht).call(this),
          this.updateResult(),
          n &&
            (r(this, v) !== i ||
              z(this.options.enabled, r(this, v)) !==
                z(s.enabled, r(this, v)) ||
              yt(this.options.staleTime, r(this, v)) !==
                yt(s.staleTime, r(this, v))) &&
            p(this, O, ue).call(this));
        const a = p(this, O, he).call(this);
        n &&
          (r(this, v) !== i ||
            z(this.options.enabled, r(this, v)) !== z(s.enabled, r(this, v)) ||
            a !== r(this, ht)) &&
          p(this, O, ce).call(this, a);
      }
      getOptimisticResult(t) {
        const s = r(this, H).getQueryCache().build(r(this, H), t),
          i = this.createResult(s, t);
        return (
          Qs(this, i) &&
            (o(this, K, i),
            o(this, Dt, this.options),
            o(this, wt, r(this, v).state)),
          i
        );
      }
      getCurrentResult() {
        return r(this, K);
      }
      trackResult(t, s) {
        return new Proxy(t, {
          get: (i, n) => (
            this.trackProp(n),
            s == null || s(n),
            n === "promise" &&
              (this.trackProp("data"),
              !this.options.experimental_prefetchInRender &&
                r(this, Y).status === "pending" &&
                r(this, Y).reject(
                  new Error(
                    "experimental_prefetchInRender feature flag is not enabled",
                  ),
                )),
            Reflect.get(i, n)
          ),
        });
      }
      trackProp(t) {
        r(this, Ut).add(t);
      }
      getCurrentQuery() {
        return r(this, v);
      }
      refetch(s = {}) {
        var t = Ee(s, []);
        return this.fetch(f({}, t));
      }
      fetchOptimistic(t) {
        const s = r(this, H).defaultQueryOptions(t),
          i = r(this, H).getQueryCache().build(r(this, H), s);
        return i.fetch().then(() => this.createResult(i, s));
      }
      fetch(t) {
        var s;
        return p(this, O, Ht)
          .call(
            this,
            P(f({}, t), {
              cancelRefetch: (s = t.cancelRefetch) != null ? s : !0,
            }),
          )
          .then(() => (this.updateResult(), r(this, K)));
      }
      createResult(t, s) {
        var pt;
        const i = r(this, v),
          n = this.options,
          a = r(this, K),
          u = r(this, wt),
          h = r(this, Dt),
          m = t !== i ? t.state : r(this, Gt),
          { state: S } = t;
        let y = f({}, S),
          w = !1,
          b;
        if (s._optimisticResults) {
          const D = this.hasListeners(),
            F = !D && Ae(t, s),
            k = D && qe(t, i, s, n);
          ((F || k) && (y = f(f({}, y), is(S.data, t.options))),
            s._optimisticResults === "isRestoring" && (y.fetchStatus = "idle"));
        }
        let { error: I, errorUpdatedAt: C, status: g } = y;
        b = y.data;
        let R = !1;
        if (s.placeholderData !== void 0 && b === void 0 && g === "pending") {
          let D;
          (a != null &&
          a.isPlaceholderData &&
          s.placeholderData === (h == null ? void 0 : h.placeholderData)
            ? ((D = a.data), (R = !0))
            : (D =
                typeof s.placeholderData == "function"
                  ? s.placeholderData(
                      (pt = r(this, qt)) == null ? void 0 : pt.state.data,
                      r(this, qt),
                    )
                  : s.placeholderData),
            D !== void 0 &&
              ((g = "success"),
              (b = ne(a == null ? void 0 : a.data, D, s)),
              (w = !0)));
        }
        if (s.select && b !== void 0 && !R)
          if (
            a &&
            b === (u == null ? void 0 : u.data) &&
            s.select === r(this, zt)
          )
            b = r(this, At);
          else
            try {
              (o(this, zt, s.select),
                (b = s.select(b)),
                (b = ne(a == null ? void 0 : a.data, b, s)),
                o(this, At, b),
                o(this, ut, null));
            } catch (D) {
              o(this, ut, D);
            }
        r(this, ut) &&
          ((I = r(this, ut)),
          (b = r(this, At)),
          (C = Date.now()),
          (g = "error"));
        const T = y.fetchStatus === "fetching",
          j = g === "pending",
          d = g === "error",
          M = j && T,
          q = b !== void 0,
          x = {
            status: g,
            fetchStatus: y.fetchStatus,
            isPending: j,
            isSuccess: g === "success",
            isError: d,
            isInitialLoading: M,
            isLoading: M,
            data: b,
            dataUpdatedAt: y.dataUpdatedAt,
            error: I,
            errorUpdatedAt: C,
            failureCount: y.fetchFailureCount,
            failureReason: y.fetchFailureReason,
            errorUpdateCount: y.errorUpdateCount,
            isFetched: y.dataUpdateCount > 0 || y.errorUpdateCount > 0,
            isFetchedAfterMount:
              y.dataUpdateCount > m.dataUpdateCount ||
              y.errorUpdateCount > m.errorUpdateCount,
            isFetching: T,
            isRefetching: T && !j,
            isLoadingError: d && !q,
            isPaused: y.fetchStatus === "paused",
            isPlaceholderData: w,
            isRefetchError: d && q,
            isStale: Se(t, s),
            refetch: this.refetch,
            promise: r(this, Y),
            isEnabled: z(s.enabled, t) !== !1,
          };
        if (this.options.experimental_prefetchInRender) {
          const D = (Vt) => {
              x.status === "error"
                ? Vt.reject(x.error)
                : x.data !== void 0 && Vt.resolve(x.data);
            },
            F = () => {
              const Vt = o(this, Y, (x.promise = ae()));
              D(Vt);
            },
            k = r(this, Y);
          switch (k.status) {
            case "pending":
              t.queryHash === i.queryHash && D(k);
              break;
            case "fulfilled":
              (x.status === "error" || x.data !== k.value) && F();
              break;
            case "rejected":
              (x.status !== "error" || x.error !== k.reason) && F();
              break;
          }
        }
        return x;
      }
      updateResult() {
        const t = r(this, K),
          s = this.createResult(r(this, v), this.options);
        if (
          (o(this, wt, r(this, v).state),
          o(this, Dt, this.options),
          r(this, wt).data !== void 0 && o(this, qt, r(this, v)),
          te(s, t))
        )
          return;
        o(this, K, s);
        const i = () => {
          if (!t) return !0;
          const { notifyOnChangeProps: n } = this.options,
            a = typeof n == "function" ? n() : n;
          if (a === "all" || (!a && !r(this, Ut).size)) return !0;
          const u = new Set(a != null ? a : r(this, Ut));
          return (
            this.options.throwOnError && u.add("error"),
            Object.keys(r(this, K)).some((h) => {
              const l = h;
              return r(this, K)[l] !== t[l] && u.has(l);
            })
          );
        };
        p(this, O, rs).call(this, { listeners: i() });
      }
      onQueryUpdate() {
        (this.updateResult(), this.hasListeners() && p(this, O, le).call(this));
      }
    }),
    (H = new WeakMap()),
    (v = new WeakMap()),
    (Gt = new WeakMap()),
    (K = new WeakMap()),
    (wt = new WeakMap()),
    (Dt = new WeakMap()),
    (Y = new WeakMap()),
    (ut = new WeakMap()),
    (zt = new WeakMap()),
    (At = new WeakMap()),
    (qt = new WeakMap()),
    (Rt = new WeakMap()),
    (Pt = new WeakMap()),
    (ht = new WeakMap()),
    (Ut = new WeakMap()),
    (O = new WeakSet()),
    (Ht = function (t) {
      p(this, O, ye).call(this);
      let s = r(this, v).fetch(this.options, t);
      return ((t != null && t.throwOnError) || (s = s.catch(_)), s);
    }),
    (ue = function () {
      p(this, O, de).call(this);
      const t = yt(this.options.staleTime, r(this, v));
      if (Et || r(this, K).isStale || !ie(t)) return;
      const i = Je(r(this, K).dataUpdatedAt, t) + 1;
      o(
        this,
        Rt,
        vt.setTimeout(() => {
          r(this, K).isStale || this.updateResult();
        }, i),
      );
    }),
    (he = function () {
      var t;
      return (t =
        typeof this.options.refetchInterval == "function"
          ? this.options.refetchInterval(r(this, v))
          : this.options.refetchInterval) != null
        ? t
        : !1;
    }),
    (ce = function (t) {
      (p(this, O, fe).call(this),
        o(this, ht, t),
        !(
          Et ||
          z(this.options.enabled, r(this, v)) === !1 ||
          !ie(r(this, ht)) ||
          r(this, ht) === 0
        ) &&
          o(
            this,
            Pt,
            vt.setInterval(
              () => {
                (this.options.refetchIntervalInBackground || Ce.isFocused()) &&
                  p(this, O, Ht).call(this);
              },
              r(this, ht),
            ),
          ));
    }),
    (le = function () {
      (p(this, O, ue).call(this),
        p(this, O, ce).call(this, p(this, O, he).call(this)));
    }),
    (de = function () {
      r(this, Rt) && (vt.clearTimeout(r(this, Rt)), o(this, Rt, void 0));
    }),
    (fe = function () {
      r(this, Pt) && (vt.clearInterval(r(this, Pt)), o(this, Pt, void 0));
    }),
    (ye = function () {
      const t = r(this, H).getQueryCache().build(r(this, H), this.options);
      if (t === r(this, v)) return;
      const s = r(this, v);
      (o(this, v, t),
        o(this, Gt, t.state),
        this.hasListeners() &&
          (s == null || s.removeObserver(this), t.addObserver(this)));
    }),
    (rs = function (t) {
      Q.batch(() => {
        (t.listeners &&
          this.listeners.forEach((s) => {
            s(r(this, K));
          }),
          r(this, H)
            .getQueryCache()
            .notify({ query: r(this, v), type: "observerResultsUpdated" }));
      });
    }),
    Be);
function Ms(e, t) {
  return (
    z(t.enabled, e) !== !1 &&
    e.state.data === void 0 &&
    !(e.state.status === "error" && t.retryOnMount === !1)
  );
}
function Ae(e, t) {
  return Ms(e, t) || (e.state.data !== void 0 && pe(e, t, t.refetchOnMount));
}
function pe(e, t, s) {
  if (z(t.enabled, e) !== !1 && yt(t.staleTime, e) !== "static") {
    const i = typeof s == "function" ? s(e) : s;
    return i === "always" || (i !== !1 && Se(e, t));
  }
  return !1;
}
function qe(e, t, s, i) {
  return (
    (e !== t || z(i.enabled, e) === !1) &&
    (!s.suspense || e.state.status !== "error") &&
    Se(e, s)
  );
}
function Se(e, t) {
  return z(t.enabled, e) !== !1 && e.isStaleByTime(yt(t.staleTime, e));
}
function Qs(e, t) {
  return !te(e.getCurrentResult(), t);
}
function Ue(e) {
  return {
    onFetch: (t, s) => {
      var S, y, w, b, I;
      const i = t.options,
        n =
          (w =
            (y = (S = t.fetchOptions) == null ? void 0 : S.meta) == null
              ? void 0
              : y.fetchMore) == null
            ? void 0
            : w.direction,
        a = ((b = t.state.data) == null ? void 0 : b.pages) || [],
        u = ((I = t.state.data) == null ? void 0 : I.pageParams) || [];
      let h = { pages: [], pageParams: [] },
        l = 0;
      const m = () =>
        mt(this, null, function* () {
          var j;
          let C = !1;
          const g = (d) => {
              Object.defineProperty(d, "signal", {
                enumerable: !0,
                get: () => (
                  t.signal.aborted
                    ? (C = !0)
                    : t.signal.addEventListener("abort", () => {
                        C = !0;
                      }),
                  t.signal
                ),
              });
            },
            R = Xe(t.options, t.fetchOptions),
            T = (d, M, q) =>
              mt(this, null, function* () {
                if (C) return Promise.reject();
                if (M == null && d.pages.length) return Promise.resolve(d);
                const x = (() => {
                    const k = {
                      client: t.client,
                      queryKey: t.queryKey,
                      pageParam: M,
                      direction: q ? "backward" : "forward",
                      meta: t.options.meta,
                    };
                    return (g(k), k);
                  })(),
                  pt = yield R(x),
                  { maxPages: D } = t.options,
                  F = q ? Cs : gs;
                return {
                  pages: F(d.pages, pt, D),
                  pageParams: F(d.pageParams, M, D),
                };
              });
          if (n && a.length) {
            const d = n === "backward",
              M = d ? Is : je,
              q = { pages: a, pageParams: u },
              B = M(i, q);
            h = yield T(q, B, d);
          } else {
            const d = e != null ? e : a.length;
            do {
              const M =
                l === 0
                  ? (j = u[0]) != null
                    ? j
                    : i.initialPageParam
                  : je(i, h);
              if (l > 0 && M == null) break;
              ((h = yield T(h, M)), l++);
            } while (l < d);
          }
          return h;
        });
      t.options.persister
        ? (t.fetchFn = () => {
            var C, g;
            return (g = (C = t.options).persister) == null
              ? void 0
              : g.call(
                  C,
                  m,
                  {
                    client: t.client,
                    queryKey: t.queryKey,
                    meta: t.options.meta,
                    signal: t.signal,
                  },
                  s,
                );
          })
        : (t.fetchFn = m);
    },
  };
}
function je(e, { pages: t, pageParams: s }) {
  const i = t.length - 1;
  return t.length > 0 ? e.getNextPageParam(t[i], t, s[i], s) : void 0;
}
function Is(e, { pages: t, pageParams: s }) {
  var i;
  return t.length > 0
    ? (i = e.getPreviousPageParam) == null
      ? void 0
      : i.call(e, t[0], t, s[0], s)
    : void 0;
}
var Wt,
  V,
  L,
  Ft,
  J,
  rt,
  Ge,
  Ts =
    ((Ge = class extends ss {
      constructor(t) {
        super();
        c(this, J);
        c(this, Wt);
        c(this, V);
        c(this, L);
        c(this, Ft);
        (o(this, Wt, t.client),
          (this.mutationId = t.mutationId),
          o(this, L, t.mutationCache),
          o(this, V, []),
          (this.state = t.state || ns()),
          this.setOptions(t.options),
          this.scheduleGc());
      }
      setOptions(t) {
        ((this.options = t), this.updateGcTime(this.options.gcTime));
      }
      get meta() {
        return this.options.meta;
      }
      addObserver(t) {
        r(this, V).includes(t) ||
          (r(this, V).push(t),
          this.clearGcTimeout(),
          r(this, L).notify({
            type: "observerAdded",
            mutation: this,
            observer: t,
          }));
      }
      removeObserver(t) {
        (o(
          this,
          V,
          r(this, V).filter((s) => s !== t),
        ),
          this.scheduleGc(),
          r(this, L).notify({
            type: "observerRemoved",
            mutation: this,
            observer: t,
          }));
      }
      optionalRemove() {
        r(this, V).length ||
          (this.state.status === "pending"
            ? this.scheduleGc()
            : r(this, L).remove(this));
      }
      continue() {
        var t, s;
        return (s = (t = r(this, Ft)) == null ? void 0 : t.continue()) != null
          ? s
          : this.execute(this.state.variables);
      }
      execute(t) {
        return mt(this, null, function* () {
          var u, h, l, m, S, y, w, b, I, C, g, R, T, j, d, M, q, B, x, pt, D;
          const s = () => {
              p(this, J, rt).call(this, { type: "continue" });
            },
            i = {
              client: r(this, Wt),
              meta: this.options.meta,
              mutationKey: this.options.mutationKey,
            };
          o(
            this,
            Ft,
            es({
              fn: () =>
                this.options.mutationFn
                  ? this.options.mutationFn(t, i)
                  : Promise.reject(new Error("No mutationFn found")),
              onFail: (F, k) => {
                p(this, J, rt).call(this, {
                  type: "failed",
                  failureCount: F,
                  error: k,
                });
              },
              onPause: () => {
                p(this, J, rt).call(this, { type: "pause" });
              },
              onContinue: s,
              retry: (u = this.options.retry) != null ? u : 0,
              retryDelay: this.options.retryDelay,
              networkMode: this.options.networkMode,
              canRun: () => r(this, L).canRun(this),
            }),
          );
          const n = this.state.status === "pending",
            a = !r(this, Ft).canStart();
          try {
            if (n) s();
            else {
              (p(this, J, rt).call(this, {
                type: "pending",
                variables: t,
                isPaused: a,
              }),
                yield (l = (h = r(this, L).config).onMutate) == null
                  ? void 0
                  : l.call(h, t, this, i));
              const k = yield (S = (m = this.options).onMutate) == null
                ? void 0
                : S.call(m, t, i);
              k !== this.state.context &&
                p(this, J, rt).call(this, {
                  type: "pending",
                  context: k,
                  variables: t,
                  isPaused: a,
                });
            }
            const F = yield r(this, Ft).start();
            return (
              yield (w = (y = r(this, L).config).onSuccess) == null
                ? void 0
                : w.call(y, F, t, this.state.context, this, i),
              yield (I = (b = this.options).onSuccess) == null
                ? void 0
                : I.call(b, F, t, this.state.context, i),
              yield (g = (C = r(this, L).config).onSettled) == null
                ? void 0
                : g.call(
                    C,
                    F,
                    null,
                    this.state.variables,
                    this.state.context,
                    this,
                    i,
                  ),
              yield (T = (R = this.options).onSettled) == null
                ? void 0
                : T.call(R, F, null, t, this.state.context, i),
              p(this, J, rt).call(this, { type: "success", data: F }),
              F
            );
          } catch (F) {
            try {
              throw (
                yield (d = (j = r(this, L).config).onError) == null
                  ? void 0
                  : d.call(j, F, t, this.state.context, this, i),
                yield (q = (M = this.options).onError) == null
                  ? void 0
                  : q.call(M, F, t, this.state.context, i),
                yield (x = (B = r(this, L).config).onSettled) == null
                  ? void 0
                  : x.call(
                      B,
                      void 0,
                      F,
                      this.state.variables,
                      this.state.context,
                      this,
                      i,
                    ),
                yield (D = (pt = this.options).onSettled) == null
                  ? void 0
                  : D.call(pt, void 0, F, t, this.state.context, i),
                F
              );
            } finally {
              p(this, J, rt).call(this, { type: "error", error: F });
            }
          } finally {
            r(this, L).runNext(this);
          }
        });
      }
    }),
    (Wt = new WeakMap()),
    (V = new WeakMap()),
    (L = new WeakMap()),
    (Ft = new WeakMap()),
    (J = new WeakSet()),
    (rt = function (t) {
      const s = (i) => {
        switch (t.type) {
          case "failed":
            return P(f({}, i), {
              failureCount: t.failureCount,
              failureReason: t.error,
            });
          case "pause":
            return P(f({}, i), { isPaused: !0 });
          case "continue":
            return P(f({}, i), { isPaused: !1 });
          case "pending":
            return P(f({}, i), {
              context: t.context,
              data: void 0,
              failureCount: 0,
              failureReason: null,
              error: null,
              isPaused: t.isPaused,
              status: "pending",
              variables: t.variables,
              submittedAt: Date.now(),
            });
          case "success":
            return P(f({}, i), {
              data: t.data,
              failureCount: 0,
              failureReason: null,
              error: null,
              status: "success",
              isPaused: !1,
            });
          case "error":
            return P(f({}, i), {
              data: void 0,
              error: t.error,
              failureCount: i.failureCount + 1,
              failureReason: t.error,
              isPaused: !1,
              status: "error",
            });
        }
      };
      ((this.state = s(this.state)),
        Q.batch(() => {
          (r(this, V).forEach((i) => {
            i.onMutationUpdate(t);
          }),
            r(this, L).notify({ mutation: this, type: "updated", action: t }));
        }));
    }),
    Ge);
function ns() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: !1,
    status: "idle",
    variables: void 0,
    submittedAt: 0,
  };
}
var tt,
  $,
  $t,
  ze,
  xs =
    ((ze = class extends kt {
      constructor(t = {}) {
        super();
        c(this, tt);
        c(this, $);
        c(this, $t);
        ((this.config = t),
          o(this, tt, new Set()),
          o(this, $, new Map()),
          o(this, $t, 0));
      }
      build(t, s, i) {
        const n = new Ts({
          client: t,
          mutationCache: this,
          mutationId: ++Zt(this, $t)._,
          options: t.defaultMutationOptions(s),
          state: i,
        });
        return (this.add(n), n);
      }
      add(t) {
        r(this, tt).add(t);
        const s = Xt(t);
        if (typeof s == "string") {
          const i = r(this, $).get(s);
          i ? i.push(t) : r(this, $).set(s, [t]);
        }
        this.notify({ type: "added", mutation: t });
      }
      remove(t) {
        if (r(this, tt).delete(t)) {
          const s = Xt(t);
          if (typeof s == "string") {
            const i = r(this, $).get(s);
            if (i)
              if (i.length > 1) {
                const n = i.indexOf(t);
                n !== -1 && i.splice(n, 1);
              } else i[0] === t && r(this, $).delete(s);
          }
        }
        this.notify({ type: "removed", mutation: t });
      }
      canRun(t) {
        const s = Xt(t);
        if (typeof s == "string") {
          const i = r(this, $).get(s),
            n =
              i == null ? void 0 : i.find((a) => a.state.status === "pending");
          return !n || n === t;
        } else return !0;
      }
      runNext(t) {
        var i, n;
        const s = Xt(t);
        if (typeof s == "string") {
          const a =
            (i = r(this, $).get(s)) == null
              ? void 0
              : i.find((u) => u !== t && u.state.isPaused);
          return (n = a == null ? void 0 : a.continue()) != null
            ? n
            : Promise.resolve();
        } else return Promise.resolve();
      }
      clear() {
        Q.batch(() => {
          (r(this, tt).forEach((t) => {
            this.notify({ type: "removed", mutation: t });
          }),
            r(this, tt).clear(),
            r(this, $).clear());
        });
      }
      getAll() {
        return Array.from(r(this, tt));
      }
      find(t) {
        const s = f({ exact: !0 }, t);
        return this.getAll().find((i) => Qe(s, i));
      }
      findAll(t = {}) {
        return this.getAll().filter((s) => Qe(t, s));
      }
      notify(t) {
        Q.batch(() => {
          this.listeners.forEach((s) => {
            s(t);
          });
        });
      }
      resumePausedMutations() {
        const t = this.getAll().filter((s) => s.state.isPaused);
        return Q.batch(() => Promise.all(t.map((s) => s.continue().catch(_))));
      }
    }),
    (tt = new WeakMap()),
    ($ = new WeakMap()),
    ($t = new WeakMap()),
    ze);
function Xt(e) {
  var t;
  return (t = e.options.scope) == null ? void 0 : t.id;
}
var et,
  ct,
  N,
  st,
  it,
  Yt,
  me,
  We,
  Ds =
    ((We = class extends kt {
      constructor(t, s) {
        super();
        c(this, it);
        c(this, et);
        c(this, ct);
        c(this, N);
        c(this, st);
        (o(this, et, t),
          this.setOptions(s),
          this.bindMethods(),
          p(this, it, Yt).call(this));
      }
      bindMethods() {
        ((this.mutate = this.mutate.bind(this)),
          (this.reset = this.reset.bind(this)));
      }
      setOptions(t) {
        var i;
        const s = this.options;
        ((this.options = r(this, et).defaultMutationOptions(t)),
          te(this.options, s) ||
            r(this, et)
              .getMutationCache()
              .notify({
                type: "observerOptionsUpdated",
                mutation: r(this, N),
                observer: this,
              }),
          s != null &&
          s.mutationKey &&
          this.options.mutationKey &&
          Mt(s.mutationKey) !== Mt(this.options.mutationKey)
            ? this.reset()
            : ((i = r(this, N)) == null ? void 0 : i.state.status) ===
                "pending" && r(this, N).setOptions(this.options));
      }
      onUnsubscribe() {
        var t;
        this.hasListeners() ||
          (t = r(this, N)) == null ||
          t.removeObserver(this);
      }
      onMutationUpdate(t) {
        (p(this, it, Yt).call(this), p(this, it, me).call(this, t));
      }
      getCurrentResult() {
        return r(this, ct);
      }
      reset() {
        var t;
        ((t = r(this, N)) == null || t.removeObserver(this),
          o(this, N, void 0),
          p(this, it, Yt).call(this),
          p(this, it, me).call(this));
      }
      mutate(t, s) {
        var i;
        return (
          o(this, st, s),
          (i = r(this, N)) == null || i.removeObserver(this),
          o(
            this,
            N,
            r(this, et).getMutationCache().build(r(this, et), this.options),
          ),
          r(this, N).addObserver(this),
          r(this, N).execute(t)
        );
      }
    }),
    (et = new WeakMap()),
    (ct = new WeakMap()),
    (N = new WeakMap()),
    (st = new WeakMap()),
    (it = new WeakSet()),
    (Yt = function () {
      var s, i;
      const t =
        (i = (s = r(this, N)) == null ? void 0 : s.state) != null ? i : ns();
      o(
        this,
        ct,
        P(f({}, t), {
          isPending: t.status === "pending",
          isSuccess: t.status === "success",
          isError: t.status === "error",
          isIdle: t.status === "idle",
          mutate: this.mutate,
          reset: this.reset,
        }),
      );
    }),
    (me = function (t) {
      Q.batch(() => {
        var s, i, n, a, u, h, l, m;
        if (r(this, st) && this.hasListeners()) {
          const S = r(this, ct).variables,
            y = r(this, ct).context,
            w = {
              client: r(this, et),
              meta: this.options.meta,
              mutationKey: this.options.mutationKey,
            };
          (t == null ? void 0 : t.type) === "success"
            ? ((i = (s = r(this, st)).onSuccess) == null ||
                i.call(s, t.data, S, y, w),
              (a = (n = r(this, st)).onSettled) == null ||
                a.call(n, t.data, null, S, y, w))
            : (t == null ? void 0 : t.type) === "error" &&
              ((h = (u = r(this, st)).onError) == null ||
                h.call(u, t.error, S, y, w),
              (m = (l = r(this, st)).onSettled) == null ||
                m.call(l, void 0, t.error, S, y, w));
        }
        this.listeners.forEach((S) => {
          S(r(this, ct));
        });
      });
    }),
    We),
  Z,
  $e,
  As =
    (($e = class extends kt {
      constructor(t = {}) {
        super();
        c(this, Z);
        ((this.config = t), o(this, Z, new Map()));
      }
      build(t, s, i) {
        var h;
        const n = s.queryKey,
          a = (h = s.queryHash) != null ? h : be(n, s);
        let u = this.get(a);
        return (
          u ||
            ((u = new Fs({
              client: t,
              queryKey: n,
              queryHash: a,
              options: t.defaultQueryOptions(s),
              state: i,
              defaultOptions: t.getQueryDefaults(n),
            })),
            this.add(u)),
          u
        );
      }
      add(t) {
        r(this, Z).has(t.queryHash) ||
          (r(this, Z).set(t.queryHash, t),
          this.notify({ type: "added", query: t }));
      }
      remove(t) {
        const s = r(this, Z).get(t.queryHash);
        s &&
          (t.destroy(),
          s === t && r(this, Z).delete(t.queryHash),
          this.notify({ type: "removed", query: t }));
      }
      clear() {
        Q.batch(() => {
          this.getAll().forEach((t) => {
            this.remove(t);
          });
        });
      }
      get(t) {
        return r(this, Z).get(t);
      }
      getAll() {
        return [...r(this, Z).values()];
      }
      find(t) {
        const s = f({ exact: !0 }, t);
        return this.getAll().find((i) => Me(s, i));
      }
      findAll(t = {}) {
        const s = this.getAll();
        return Object.keys(t).length > 0 ? s.filter((i) => Me(t, i)) : s;
      }
      notify(t) {
        Q.batch(() => {
          this.listeners.forEach((s) => {
            s(t);
          });
        });
      }
      onFocus() {
        Q.batch(() => {
          this.getAll().forEach((t) => {
            t.onFocus();
          });
        });
      }
      onOnline() {
        Q.batch(() => {
          this.getAll().forEach((t) => {
            t.onOnline();
          });
        });
      }
    }),
    (Z = new WeakMap()),
    $e),
  E,
  lt,
  dt,
  jt,
  Kt,
  ft,
  Lt,
  _t,
  Ve,
  Vs =
    ((Ve = class {
      constructor(e = {}) {
        c(this, E);
        c(this, lt);
        c(this, dt);
        c(this, jt);
        c(this, Kt);
        c(this, ft);
        c(this, Lt);
        c(this, _t);
        (o(this, E, e.queryCache || new As()),
          o(this, lt, e.mutationCache || new xs()),
          o(this, dt, e.defaultOptions || {}),
          o(this, jt, new Map()),
          o(this, Kt, new Map()),
          o(this, ft, 0));
      }
      mount() {
        (Zt(this, ft)._++,
          r(this, ft) === 1 &&
            (o(
              this,
              Lt,
              Ce.subscribe((e) =>
                mt(this, null, function* () {
                  e &&
                    (yield this.resumePausedMutations(), r(this, E).onFocus());
                }),
              ),
            ),
            o(
              this,
              _t,
              ee.subscribe((e) =>
                mt(this, null, function* () {
                  e &&
                    (yield this.resumePausedMutations(), r(this, E).onOnline());
                }),
              ),
            )));
      }
      unmount() {
        var e, t;
        (Zt(this, ft)._--,
          r(this, ft) === 0 &&
            ((e = r(this, Lt)) == null || e.call(this),
            o(this, Lt, void 0),
            (t = r(this, _t)) == null || t.call(this),
            o(this, _t, void 0)));
      }
      isFetching(e) {
        return r(this, E).findAll(P(f({}, e), { fetchStatus: "fetching" }))
          .length;
      }
      isMutating(e) {
        return r(this, lt).findAll(P(f({}, e), { status: "pending" })).length;
      }
      getQueryData(e) {
        var s;
        const t = this.defaultQueryOptions({ queryKey: e });
        return (s = r(this, E).get(t.queryHash)) == null
          ? void 0
          : s.state.data;
      }
      ensureQueryData(e) {
        const t = this.defaultQueryOptions(e),
          s = r(this, E).build(this, t),
          i = s.state.data;
        return i === void 0
          ? this.fetchQuery(e)
          : (e.revalidateIfStale &&
              s.isStaleByTime(yt(t.staleTime, s)) &&
              this.prefetchQuery(t),
            Promise.resolve(i));
      }
      getQueriesData(e) {
        return r(this, E)
          .findAll(e)
          .map(({ queryKey: t, state: s }) => {
            const i = s.data;
            return [t, i];
          });
      }
      setQueryData(e, t, s) {
        const i = this.defaultQueryOptions({ queryKey: e }),
          n = r(this, E).get(i.queryHash),
          a = n == null ? void 0 : n.state.data,
          u = ms(t, a);
        if (u !== void 0)
          return r(this, E)
            .build(this, i)
            .setData(u, P(f({}, s), { manual: !0 }));
      }
      setQueriesData(e, t, s) {
        return Q.batch(() =>
          r(this, E)
            .findAll(e)
            .map(({ queryKey: i }) => [i, this.setQueryData(i, t, s)]),
        );
      }
      getQueryState(e) {
        var s;
        const t = this.defaultQueryOptions({ queryKey: e });
        return (s = r(this, E).get(t.queryHash)) == null ? void 0 : s.state;
      }
      removeQueries(e) {
        const t = r(this, E);
        Q.batch(() => {
          t.findAll(e).forEach((s) => {
            t.remove(s);
          });
        });
      }
      resetQueries(e, t) {
        const s = r(this, E);
        return Q.batch(
          () => (
            s.findAll(e).forEach((i) => {
              i.reset();
            }),
            this.refetchQueries(f({ type: "active" }, e), t)
          ),
        );
      }
      cancelQueries(e, t = {}) {
        const s = f({ revert: !0 }, t),
          i = Q.batch(() =>
            r(this, E)
              .findAll(e)
              .map((n) => n.cancel(s)),
          );
        return Promise.all(i).then(_).catch(_);
      }
      invalidateQueries(e, t = {}) {
        return Q.batch(() => {
          var s, i;
          return (
            r(this, E)
              .findAll(e)
              .forEach((n) => {
                n.invalidate();
              }),
            (e == null ? void 0 : e.refetchType) === "none"
              ? Promise.resolve()
              : this.refetchQueries(
                  P(f({}, e), {
                    type:
                      (i =
                        (s = e == null ? void 0 : e.refetchType) != null
                          ? s
                          : e == null
                            ? void 0
                            : e.type) != null
                        ? i
                        : "active",
                  }),
                  t,
                )
          );
        });
      }
      refetchQueries(e, t = {}) {
        var n;
        const s = P(f({}, t), {
            cancelRefetch: (n = t.cancelRefetch) != null ? n : !0,
          }),
          i = Q.batch(() =>
            r(this, E)
              .findAll(e)
              .filter((a) => !a.isDisabled() && !a.isStatic())
              .map((a) => {
                let u = a.fetch(void 0, s);
                return (
                  s.throwOnError || (u = u.catch(_)),
                  a.state.fetchStatus === "paused" ? Promise.resolve() : u
                );
              }),
          );
        return Promise.all(i).then(_);
      }
      fetchQuery(e) {
        const t = this.defaultQueryOptions(e);
        t.retry === void 0 && (t.retry = !1);
        const s = r(this, E).build(this, t);
        return s.isStaleByTime(yt(t.staleTime, s))
          ? s.fetch(t)
          : Promise.resolve(s.state.data);
      }
      prefetchQuery(e) {
        return this.fetchQuery(e).then(_).catch(_);
      }
      fetchInfiniteQuery(e) {
        return ((e.behavior = Ue(e.pages)), this.fetchQuery(e));
      }
      prefetchInfiniteQuery(e) {
        return this.fetchInfiniteQuery(e).then(_).catch(_);
      }
      ensureInfiniteQueryData(e) {
        return ((e.behavior = Ue(e.pages)), this.ensureQueryData(e));
      }
      resumePausedMutations() {
        return ee.isOnline()
          ? r(this, lt).resumePausedMutations()
          : Promise.resolve();
      }
      getQueryCache() {
        return r(this, E);
      }
      getMutationCache() {
        return r(this, lt);
      }
      getDefaultOptions() {
        return r(this, dt);
      }
      setDefaultOptions(e) {
        o(this, dt, e);
      }
      setQueryDefaults(e, t) {
        r(this, jt).set(Mt(e), { queryKey: e, defaultOptions: t });
      }
      getQueryDefaults(e) {
        const t = [...r(this, jt).values()],
          s = {};
        return (
          t.forEach((i) => {
            Nt(e, i.queryKey) && Object.assign(s, i.defaultOptions);
          }),
          s
        );
      }
      setMutationDefaults(e, t) {
        r(this, Kt).set(Mt(e), { mutationKey: e, defaultOptions: t });
      }
      getMutationDefaults(e) {
        const t = [...r(this, Kt).values()],
          s = {};
        return (
          t.forEach((i) => {
            Nt(e, i.mutationKey) && Object.assign(s, i.defaultOptions);
          }),
          s
        );
      }
      defaultQueryOptions(e) {
        if (e._defaulted) return e;
        const t = P(
          f(
            f(f({}, r(this, dt).queries), this.getQueryDefaults(e.queryKey)),
            e,
          ),
          { _defaulted: !0 },
        );
        return (
          t.queryHash || (t.queryHash = be(t.queryKey, t)),
          t.refetchOnReconnect === void 0 &&
            (t.refetchOnReconnect = t.networkMode !== "always"),
          t.throwOnError === void 0 && (t.throwOnError = !!t.suspense),
          !t.networkMode && t.persister && (t.networkMode = "offlineFirst"),
          t.queryFn === ge && (t.enabled = !1),
          t
        );
      }
      defaultMutationOptions(e) {
        return e != null && e._defaulted
          ? e
          : P(
              f(
                f(
                  f({}, r(this, dt).mutations),
                  (e == null ? void 0 : e.mutationKey) &&
                    this.getMutationDefaults(e.mutationKey),
                ),
                e,
              ),
              { _defaulted: !0 },
            );
      }
      clear() {
        (r(this, E).clear(), r(this, lt).clear());
      }
    }),
    (E = new WeakMap()),
    (lt = new WeakMap()),
    (dt = new WeakMap()),
    (jt = new WeakMap()),
    (Kt = new WeakMap()),
    (ft = new WeakMap()),
    (Lt = new WeakMap()),
    (_t = new WeakMap()),
    Ve),
  as = U.createContext(void 0),
  os = (e) => {
    const t = U.useContext(as);
    if (!t)
      throw new Error("No QueryClient set, use QueryClientProvider to set one");
    return t;
  },
  Js = ({ client: e, children: t }) => (
    U.useEffect(
      () => (
        e.mount(),
        () => {
          e.unmount();
        }
      ),
      [e],
    ),
    ds.jsx(as.Provider, { value: e, children: t })
  ),
  us = U.createContext(!1),
  qs = () => U.useContext(us);
us.Provider;
function Us() {
  let e = !1;
  return {
    clearReset: () => {
      e = !1;
    },
    reset: () => {
      e = !0;
    },
    isReset: () => e,
  };
}
var js = U.createContext(Us()),
  Ks = () => U.useContext(js),
  Ls = (e, t) => {
    (e.suspense || e.throwOnError || e.experimental_prefetchInRender) &&
      (t.isReset() || (e.retryOnMount = !1));
  },
  _s = (e) => {
    U.useEffect(() => {
      e.clearReset();
    }, [e]);
  },
  ks = ({
    result: e,
    errorResetBoundary: t,
    throwOnError: s,
    query: i,
    suspense: n,
  }) =>
    e.isError &&
    !t.isReset() &&
    !e.isFetching &&
    i &&
    ((n && e.data === void 0) || Ye(s, [e.error, i])),
  Hs = (e) => {
    if (e.suspense) {
      const s = (n) =>
          n === "static" ? n : Math.max(n != null ? n : 1e3, 1e3),
        i = e.staleTime;
      ((e.staleTime = typeof i == "function" ? (...n) => s(i(...n)) : s(i)),
        typeof e.gcTime == "number" && (e.gcTime = Math.max(e.gcTime, 1e3)));
    }
  },
  Ns = (e, t) => e.isLoading && e.isFetching && !t,
  Bs = (e, t) => (e == null ? void 0 : e.suspense) && t.isPending,
  Ke = (e, t, s) =>
    t.fetchOptimistic(e).catch(() => {
      s.clearReset();
    });
function Gs(e, t, s) {
  var y, w, b, I, C;
  const i = qs(),
    n = Ks(),
    a = os(),
    u = a.defaultQueryOptions(e);
  ((w =
    (y = a.getDefaultOptions().queries) == null
      ? void 0
      : y._experimental_beforeQuery) == null || w.call(y, u),
    (u._optimisticResults = i ? "isRestoring" : "optimistic"),
    Hs(u),
    Ls(u, n),
    _s(n));
  const h = !a.getQueryCache().get(u.queryHash),
    [l] = U.useState(() => new t(a, u)),
    m = l.getOptimisticResult(u),
    S = !i && e.subscribed !== !1;
  if (
    (U.useSyncExternalStore(
      U.useCallback(
        (g) => {
          const R = S ? l.subscribe(Q.batchCalls(g)) : _;
          return (l.updateResult(), R);
        },
        [l, S],
      ),
      () => l.getCurrentResult(),
      () => l.getCurrentResult(),
    ),
    U.useEffect(() => {
      l.setOptions(u);
    }, [u, l]),
    Bs(u, m))
  )
    throw Ke(u, l, n);
  if (
    ks({
      result: m,
      errorResetBoundary: n,
      throwOnError: u.throwOnError,
      query: a.getQueryCache().get(u.queryHash),
      suspense: u.suspense,
    })
  )
    throw m.error;
  if (
    ((I =
      (b = a.getDefaultOptions().queries) == null
        ? void 0
        : b._experimental_afterQuery) == null || I.call(b, u, m),
    u.experimental_prefetchInRender && !Et && Ns(m, i))
  ) {
    const g = h
      ? Ke(u, l, n)
      : (C = a.getQueryCache().get(u.queryHash)) == null
        ? void 0
        : C.promise;
    g == null ||
      g.catch(_).finally(() => {
        l.updateResult();
      });
  }
  return u.notifyOnChangeProps ? m : l.trackResult(m);
}
function Zs(e, t) {
  return Gs(e, Es);
}
function Xs(e, t) {
  const s = os(),
    [i] = U.useState(() => new Ds(s, e));
  U.useEffect(() => {
    i.setOptions(e);
  }, [i, e]);
  const n = U.useSyncExternalStore(
      U.useCallback((u) => i.subscribe(Q.batchCalls(u)), [i]),
      () => i.getCurrentResult(),
      () => i.getCurrentResult(),
    ),
    a = U.useCallback(
      (u, h) => {
        i.mutate(u, h).catch(_);
      },
      [i],
    );
  if (n.error && Ye(i.options.throwOnError, [n.error])) throw n.error;
  return P(f({}, n), { mutate: a, mutateAsync: n.mutate });
}
export { Vs as Q, os as a, Xs as b, Js as c, Zs as u };
