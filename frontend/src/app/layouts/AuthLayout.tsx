import React from "react";
import { Outlet } from "react-router-dom";

import { Card } from "../../shared/ui/Card";
import { PageContainer } from "../../shared/ui/layout/PageContainer";

/**
 * AuthLayout
 *
 * Centered auth card on a neutral background.
 * Desktop: two-column layout (illustration + form).
 * Mobile: stacked with form first.
 */
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
      <PageContainer fullWidth className="flex justify-center">
        <div className="w-full max-w-4xl">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Illustration / marketing side */}
              <aside className="hidden md:flex flex-col justify-between bg-brand-blue text-white p-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-semibold">
                      SC
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold tracking-tight">
                        SkyCrop
                      </span>
                      <span className="text-xs text-white/80">
                        Map-first crop intelligence
                      </span>
                    </div>
                  </div>
                  <h1 className="text-xl font-semibold mb-2">
                    Welcome to SkyCrop
                  </h1>
                  <p className="text-sm text-white/90">
                    Monitor field health, weather, and recommendations in a
                    single, map-first dashboard.
                  </p>
                </div>
                <p className="mt-6 text-[11px] text-white/70">
                  UX placeholder copy. This panel can later show seasonal tips,
                  system status, or onboarding.
                </p>
              </aside>

              {/* Auth form outlet (nested region, main landmark is defined in RootLayout) */}
              <section
                className="flex flex-col justify-center bg-white px-6 py-8 sm:px-8"
                aria-label="Authentication"
              >
                <Outlet />
              </section>
            </div>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
};

export default AuthLayout;
