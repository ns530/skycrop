import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { Modal } from "./Modal";

describe("Modal accessibility", () => {
  it("moves initial focus inside the dialog", async () => {
    const onClose = jest.fn();

    render(
      <Modal isOpen title="Example modal" onClose={onClose}>
        <div>
          <button type="button">First action</button>
          <button type="button">Second action</button>
        </div>
      </Modal>,
    );

    const closeButton = screen.getByRole("button", { name: /close dialog/i });

    expect(closeButton).toHaveFocus();
  });

  it("traps focus within the dialog when tabbing", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen title="Focus trap modal" onClose={onClose}>
        <div>
          <button type="button">First action</button>
          <button type="button">Second action</button>
        </div>
      </Modal>,
    );

    const closeButton = screen.getByRole("button", { name: /close dialog/i });
    const firstAction = screen.getByRole("button", { name: "First action" });
    const secondAction = screen.getByRole("button", { name: "Second action" });

    // Initial focus is on the close button in the header
    expect(closeButton).toHaveFocus();

    // Tab moves focus to the first action button
    await user.tab();
    expect(firstAction).toHaveFocus();

    // Next tab moves to the second action
    await user.tab();
    expect(secondAction).toHaveFocus();

    // Next tab wraps back to the close button
    await user.tab();
    expect(closeButton).toHaveFocus();

    // Shift+Tab from the close button wraps back to the last focusable element
    await user.tab({ shift: true });
    expect(secondAction).toHaveFocus();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen title="Dismissible modal" onClose={onClose}>
        <button type="button">Action</button>
      </Modal>,
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
