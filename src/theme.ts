import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontSize: 12,
    fontFamily: `"Gill Sans", sans-serif`,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          scrollbarWidth: "thin",
          scrollbarColor: "#929292bd var(--bg-primary)",
        },

        ".MuiPickersSectionList-root": {
          padding: "8px !important",
          color: "var(--text-primary)",
        },

        ".MuiTableCell-head": {
          backgroundColor: "var(--head) !important",
          color: "var(--text-primary) !important",
          fontWeight: 600,
          padding: "12px 16px !important",
        },

        ".MuiTableCell-body": {
          color: "var(--text-secondary) !important",
          padding: "2px 16px !important",
        },

        ".MuiDialog-paper": {
          backgroundColor: "var(--bg-primary) !important",
          color: "var(--text-primary) !important",
        },

        ".MuiMenu-paper": {
          backgroundColor: "var(--bg-primary) !important",
          color: "var(--text-primary) !important",
          maxHeight: "200px !important",
          width: "200px !important",
        },

        ".MuiSvgIcon-root": {
          // color: "var(--text-secondary)",
          fontSize: "18px !important",
        },

        ".MuiFormHelperText-root": {
          color: "var(--text-primary)",
        },

        ".MuiFormHelperText-root.Mui-error": {
          color: "#e42929 !important",
        },

        ".MuiCircularProgress-root": {
          color: "var(--color-primary) !important",
        },

        ".MuiButton-root": {
          textTransform: "capitalize !important",
        },

        ".MuiTab-root": {
          textTransform: "capitalize !important",
        },

        ".MuiSwitch-switchBase.Mui-checked": {
          color: "var(--color-primary) !important",
        },

        ".MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
          backgroundColor: "var(--color-primary) !important",
        },

        ".MuiPickersOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "#02afff !important",
            borderWidth: "2px",
          },

        ".MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--border-color) !important",
        },

        ".MuiPickersOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--border-color) !important",
        },

        ".MuiPickersOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "var(--border-color) !important",
          },

        ".MuiPickersOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "#02afff !important",
            borderWidth: "2px",
          },

        ".MuiPickersOutlinedInput-root .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "var(--border-color) !important",
            borderWidth: "1px !important",
          },

        ".MuiPickersOutlinedInput-root:hover .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "var(--border-color) !important",
          },

        ".MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "#02afff !important",
            borderWidth: "2px !important",
          },

        ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
          padding: "0 10px 0 2px",
        },

        // DatePicker calendar day cells
        ".MuiPickerDay-root": {
          color: "var(--text-primary) !important",
          backgroundColor: "transparent !important",
        },
        ".MuiPickerDay-root:hover": {
          backgroundColor: "var(--head) !important",
        },
        ".MuiPickerDay-root.Mui-selected": {
          backgroundColor: "var(--color-primary) !important",
          color: "#fff !important",
        },
        ".MuiPickerDay-root.MuiPickerDay-today:not(.Mui-selected)": {
          border: "1px solid !important",
          color: "var(--color-primary) !important",
        },

        // Weekday header labels
        ".MuiDayCalendar-weekDayLabel": {
          color: "var(--text-primary) !important",
        },
        ".MuiDayCalendar-header .MuiDayCalendar-weekDayLabel:first-of-type": {
          color: "var(--color-primary)  !important",
        },
        ".MuiDayCalendar-header .MuiDayCalendar-weekDayLabel:last-of-type": {
          color: "var(--color-primary)  !important",
        },

        // Sunday day cells (1st column) and Saturday day cells (7th column)
        // ".MuiDayCalendar-weekContainer .MuiPickerDay-root:nth-of-type(1):not(.MuiPickerDay-fillerCell):not(.Mui-selected)": {
        //   color: "var(--color-primary) !important",
        // },
        // ".MuiDayCalendar-weekContainer .MuiPickerDay-root:nth-of-type(7):not(.MuiPickerDay-fillerCell):not(.Mui-selected)": {
        //   color: "var(--color-primary) !important",
        // },

        // DatePicker input — calendar toggle icon button
        ".MuiInputAdornment-root .MuiIconButton-root": {
          color: "var(--color-primary) !important",
        },

        // Calendar popup — prev/next month arrow buttons
        ".MuiPickersArrowSwitcher-previousIconButton, .MuiPickersArrowSwitcher-nextIconButton": {
          color: "var(--text-primary) !important",
        },

        // Calendar popup — month/year switch view button
        ".MuiPickersCalendarHeader-switchViewButton": {
          color: "var(--text-primary) !important",
        },

        // ".MuiPickersSectionList-root": {
        //   padding: "8px 0",
        // },
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: "12px",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          "&.MuiPickerPopper-paper": {
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root.Mui-disabled": {
            // backgroundColor: "gray",
          },

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
            fontSize: "13px",
            backgroundColor: "var(--bg-primary)",
            padding: "0 4px",
            top: "-5px",
            color: "var(--text-primary) !important",

            "&.Mui-focused": {
              color: "var(--text-primary) !important",
            },
          },
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          "&.Mui-disabled": {
            color: "gray",
            WebkitTextFillColor: "gray"
          },
          "& .MuiInputBase-input.Mui-disabled": {
            color: "gray",
            WebkitTextFillColor: "gray",
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "12px",
          top: "-5px",

          "&.Mui-focused": {
            color: "var(--text-primary) !important",
          },
          "&.Mui-disabled": {
            color: "gray",
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          color: "var(--text-primary)",
        },
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#02afff !important",
            borderWidth: "2px",
          },

          "& .MuiPickersSectionList-root": {
            padding: "10px",
          },

          "&.Mui-disabled": {
            "& .MuiOutlinedInput-notchedOutline": {
              color: "gray",
            },
          },
          // "&:hover .MuiOutlinedInput-notchedOutline": {
          //   borderColor: "var(--border-color) !important",
          // },
          // notchedOutline: {
          //   borderColor: "var(--border-color) !important",
          // },
        },
      },
    },

    MuiStack: {
      styleOverrides: {
        root: {
          overflow: "visible !important",
          paddingTop: "0 !important",
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "var(--text-primary)",

          "&.Mui-focused": {
            color: "#02afff",
          },
        },
        asterisk: {
          color: "red",
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        select: {
          padding: "10px",
          color: "var(--text-primary)",
          fontSize: "12px",
          "&.Mui-disabled": {
            color: "gray",
            WebkitTextFillColor: "gray",
          },
        },

        outlined: {
          padding: "10px",
        },

        icon: {
          color: "var(--text-primary)",
        },

        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#02afff",
          },
          "&.Mui-disabled": {
            color: "gray",
            WebkitTextFillColor: "gray",
          },
        },
      },
    },

    MuiNativeSelect: {
      styleOverrides: {
        icon: {
          color: "var(--text-primary)",
        },
        select: {
          color: "var(--text-primary)",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "capitalize",
        },
      },
    },

    MuiFormControl: {
      styleOverrides: {
        root: {
          width: "100%",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          borderBottom: "none",
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.MuiTableRow-hover:hover": {
            // backgroundColor: "#4b556354",
            cursor: "pointer",
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          "&.Mui-disabled": {
            color: "gray",
          },
        },
      },
    },

    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        },

        listbox: {
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        },

        option: {
          fontSize: "12px",
          color: "var(--text-primary)",
          backgroundColor: "var(--bg-primary)",

          "&:hover": {
            backgroundColor: "var(--head) !important",
          },

          "&.Mui-focused": {
            backgroundColor: "var(--head) !important",
          },

          "&[aria-selected='true']": {
            backgroundColor: "var(--head) !important",
          },

          "&[aria-selected='true'].Mui-focused": {
            backgroundColor: "var(--head) !important",
          },
        },

        inputRoot: {
          "& .MuiAutocomplete-input": {
            padding: "2px !important",
          },
        },

        popupIndicator: {
          color: "var(--text-primary)",

          "&:hover": {
            backgroundColor: "transparent",
          },
        },

        clearIndicator: {
          color: "var(--text-primary)",
        },

        tag: {
          backgroundColor: "var(--head)",
          color: "var(--text-primary)",
          fontSize: "12px",

          "& .MuiChip-deleteIcon": {
            color: "var(--text-secondary)",
          },

          "& .MuiChip-deleteIcon:hover": {
            color: "var(--color-primary)",
          },
        },

        noOptions: {
          color: 'var(--text-primary)',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "12px",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          "& .MuiMenuItem-root": {
            fontSize: "12px",
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: "var(--text-secondary)",
          "&.Mui-active": {
            color: "var(--text-primary)",
          },
          "&.Mui-completed": {
            color: "var(--text-primary)",
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          // color: "red",
          "&.Mui-active": {
            // color: "blue",
          },
          "&.Mui-completed": {
            color: "green",
          },
        },
      },
    },
  },
});

export default theme;
