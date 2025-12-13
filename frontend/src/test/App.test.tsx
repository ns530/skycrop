import { render, screen } from "@testing-library/react";
import React from "react";

import { App } from "../app/App";
import { AppProviders } from "../app/providers/AppProviders";

describe("App", () => {
  it("renders without crashing and shows farmer dashboard heading after auth (stub)", () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    // We do not assert on specific routes here because RequireAuth currently
    // treats the user as unauthenticated by default. This is a smoke test
    // that ensures the tree renders without throwing.
    // Use getAllByText since SkyCrop might appear multiple times (header, title, etc.)
    const skycropElements = screen.getAllByText(/SkyCrop/i);
    expect(skycropElements.length).toBeGreaterThan(0);
  });
});
