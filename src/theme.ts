import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontSize: 12,
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: "12px",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "var(--bg-primary)",
            padding: "0px",
            "& fieldset": {
              borderColor: "var(--border-color)",
              borderWidth: "1px",
            },
            "&:hover fieldset": {
              borderColor: "var(--border-color)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#02afff",
              borderWidth: "2px",
            },
          },
          "& .MuiInputBase-input": {
            fontSize: "12px",
            padding: "10px",
            color: "var(--text-primary)",
            "&::placeholder": {
              color: "var(--text-primary)",
            },
          },
          "& .MuiInputLabel-root": {
            fontSize: "12px",
            backgroundColor: "var(--bg-primary)",
            padding: "0 4px",
            color: "var(--text-primary) !important",
            "&.Mui-focused": {
              color: "var(--text-primary) !important",
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "12px",
          "&.Mui-focused": {
            color: "var(--text-primary) !important",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#02afff !important",
            borderWidth: "2px",
          },
          "& .MuiPickersSectionList-root": {
            padding: "8px",
          },
        },
      },
    },
    // Add MuiStack override
    MuiStack: {
      styleOverrides: {
        root: {
          overflow: "visible !important",
          paddingTop: "0 !important",
        },
      },
    },
    // MuiPickersOutlinedInput: {
    //   styleOverrides: {
    //     root: {
    //       "&:hover .MuiPickersOutlinedInput-notchedOutline": {
    //         borderColor: "var(--border-color)",
    //       },
    //     },
    //   },
    // },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "var(--primary-color)", // Changed to primary color
          "&.Mui-focused": {
            color: "#02afff",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: '8px',
        },
        outlined: {
          padding: '8px',
        },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#02afff',
          },
        },
      },
    },
  },
});

theme.components = {
  ...theme.components,
  MuiCssBaseline: {
    styleOverrides: {
      ".MuiPickersOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline":
        {
          borderColor: "#02afff !important",
          borderWidth: "2px",
        },
      ".css-lqwr9g-MuiPickersOutlinedInput-notchedOutline": {
        borderColor: "var(--border-color) !important",
      },
    },
  },
};

export default theme;
