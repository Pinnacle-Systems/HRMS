import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "../../src/context/Theme";
import { UIProvider } from "../../src/context/Snackbar";
import muiTheme from "../../src/theme";

type RenderWithProvidersOptions = RenderOptions & {
  route?: string;
};

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", ...options }: RenderWithProvidersOptions = {},
) {
  window.history.pushState({}, "Test page", route);

  return render(
    <Theme>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <UIProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </UIProvider>
      </ThemeProvider>
    </Theme>,
    options,
  );
}
