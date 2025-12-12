import React from "react";
import { Outlet } from "react-router-dom";

import { FieldMapView } from "../../shared/components/Map/FieldMapView";
import { PageContainer } from "../../shared/ui/layout/PageContainer";

/**
 * MapFirstLayout
 *
 * Map-first layout with approximately 70/30 split between map and side panel
 * on desktop, stacking vertically on smaller screens.
 */
export const MapFirstLayout: React.FC = () => {
  return (
    <div className="min-h-[70vh] bg-gray-100 text-gray-900">
      <PageContainer fullWidth className="py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-6 lg:min-h-[calc(100vh-4rem)]">
          {/* Map area */}
          <section
            aria-label="Field map"
            className="relative min-h-[320px] lg:min-h-[600px] rounded-lg overflow-hidden lg:sticky lg:top-0"
          >
            <FieldMapView showHealthOverlay />

            {/* Mobile-only helper to jump to details */}
            <a
              href="#field-details-panel"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001] inline-flex items-center rounded-md border border-white/20 bg-brand-blue shadow-lg px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
            >
              📋 Show field details
            </a>
          </section>

          {/* Side panel */}
          <aside
            id="field-details-panel"
            aria-label="Field details and actions"
            className="flex flex-col gap-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto bg-white rounded-lg p-4"
          >
            <Outlet />
          </aside>
        </div>
      </PageContainer>
    </div>
  );
};

export default MapFirstLayout;
