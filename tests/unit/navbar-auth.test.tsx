jest.mock("../../app/auth/actions", () => ({
  signOutAction: async () => {},
}));

import { NavbarView } from "@/components/layout/NavbarView";
import { render, screen } from "@testing-library/react";

describe("NavbarView", () => {
  it("shows login and signup when signed out", () => {
    render(
      <NavbarView signedIn={false} username="nobody" isAdmin={false} />,
    );
    expect(screen.getAllByTestId("nav-login").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("nav-signup").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("nav-logout-desktop")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-admin")).not.toBeInTheDocument();
  });

  it("shows username and logout when signed in", () => {
    render(
      <NavbarView signedIn username="testuser" isAdmin={false} />,
    );
    expect(screen.getByTestId("nav-username-desktop")).toHaveTextContent(
      "testuser",
    );
    expect(screen.getByTestId("nav-logout-desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-login-desktop")).not.toBeInTheDocument();
  });

  it("shows Admin link only for admins", () => {
    const { rerender } = render(
      <NavbarView signedIn username="admin" isAdmin />,
    );
    expect(screen.getByTestId("nav-admin")).toHaveAttribute("href", "/admin");

    rerender(<NavbarView signedIn username="user" isAdmin={false} />);
    expect(screen.queryByTestId("nav-admin")).not.toBeInTheDocument();
  });
});
