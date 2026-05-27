// import { createTheme } from "@mui/material/styles";

// const theme = createTheme({
//   typography: {
//     fontSize: 12,
//   },
//   components: {
//     MuiTypography: {
//       styleOverrides: {
//         root: {
//           fontSize: "12px",
//         },
//       },
//     },
//     MuiTextField: {
//       styleOverrides: {
//         root: {
//           "& .MuiOutlinedInput-root": {
//             backgroundColor: "var(--bg-primary)",
//             padding: "0px",
//             "& fieldset": {
//               borderColor: "var(--border-color)",
//               borderWidth: "1px",
//             },
//             "&:hover fieldset": {
//               borderColor: "var(--border-color)",
//             },
//             "&.Mui-focused fieldset": {
//               borderColor: "#02afff",
//               borderWidth: "2px",
//             },
//           },
//           "& .MuiInputBase-input": {
//             fontSize: "12px",
//             padding: "10px",
//             color: "var(--text-primary)",
//             "&::placeholder": {
//               color: "var(--text-primary)",
//             },
//           },
//           "& .MuiInputLabel-root": {
//             fontSize: "13px",
//             backgroundColor: "var(--bg-primary)",
//             padding: "0 4px",
//             top:"-5px",
//             color: "var(--text-primary) !important",
//             "&.Mui-focused": {
//               color: "var(--text-primary) !important",
//             },
//           },
//         },
//       },
//     },
//     MuiInputLabel: {
//       styleOverrides: {
//         root: {
//           fontSize: "12px",
//           top:"-5px",
//           "&.Mui-focused": {
//             color: "var(--text-primary) !important",
//           },
//         },
//       },
//     },
//     MuiOutlinedInput: {
//       styleOverrides: {
//         root: {
//           "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
//             borderColor: "#02afff !important",
//             borderWidth: "2px",
//           },
//           "& .MuiPickersSectionList-root": {
//             padding: "10px",
//           },
//         },
//       },
//     },
//     // Add MuiStack override
//     MuiStack: {
//       styleOverrides: {
//         root: {
//           overflow: "visible !important",
//           paddingTop: "0 !important",
//         },
//       },
//     },
//     // MuiPickersOutlinedInput: {
//     //   styleOverrides: {
//     //     root: {
//     //       "&:hover .MuiPickersOutlinedInput-notchedOutline": {
//     //         borderColor: "var(--border-color)",
//     //       },
//     //     },
//     //   },
//     // },
//     MuiFormLabel: {
//       styleOverrides: {
//         root: {
//           color: "var(--primary-color)", // Changed to primary color
//           "&.Mui-focused": {
//             color: "#02afff",
//           },
//         },
//       },
//     },
//     MuiSelect: {
//       styleOverrides: {
//         select: {
//           padding: '10px',
//         },
//         outlined: {
//           padding: '10px',
//         },
//         root: {
//           '&:hover .MuiOutlinedInput-notchedOutline': {
//             borderColor: '#02afff',
//           },
//         },
//       },
//     },
//   },
// });

// theme.components = {
//   ...theme.components,
//   MuiCssBaseline: {
//     styleOverrides: {
//       ".MuiPickersOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline":
//         {
//           borderColor: "#02afff !important",
//           borderWidth: "2px",
//         },
//       ".css-lqwr9g-MuiPickersOutlinedInput-notchedOutline": {
//         borderColor: "var(--border-color) !important",
//       },
//     },
//   },
// };

// export default theme;

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

    MuiTextField: {
      styleOverrides: {
        root: {
          // minWidth: "180px",

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

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "12px",
          top: "-5px",

          "&.Mui-focused": {
            color: "var(--text-primary) !important",
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
        inputRoot: {
          "& .MuiAutocomplete-input": {
            padding: "1px !important",
          },
        },
      },
    },
  },
});

export default theme;
