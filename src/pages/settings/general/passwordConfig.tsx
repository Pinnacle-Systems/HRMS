import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Button,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import PasswordIcon from "@mui/icons-material/Password";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getCurrentRouteLabel } from "../const";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { companyService } from "../../../services/modules/company";
import { useUI } from "../../../context/Snackbar";

export default function PasswordConfig() {
  const [config, setConfig] = useState({
    minPasswordLength: 12,
    passwordExpiryDays: 90,
    expiryReminderDays: 7,
    maxInvalidLoginAttempts: 5,
    welcomePasswordExpiryDays: 3,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
    requireMfa: true,
  });
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const handleChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const fetchPasswordConfig = async () => {
    showSpinner();
    try {
      const response: any = await companyService.getPasswordConfig();
      if (response?.data) {
        setConfig(response.data);
      }
    } catch (error) {
      showSnackbar("Failed to fetch password config", 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleSave = async () => {
    showSpinner();
    try {
      const updatedValue = {
        "minPasswordLength": config.minPasswordLength,
        "passwordExpiryDays": config.passwordExpiryDays,
        "expiryReminderDays": config.expiryReminderDays,
        "maxInvalidLoginAttempts": config.maxInvalidLoginAttempts,
        "welcomePasswordExpiryDays": config.welcomePasswordExpiryDays,
        "requireUppercase": config.requireUppercase,
        "requireLowercase": config.requireLowercase,
        "requireDigit": config.requireDigit,
        "requireSpecialChar": config.requireSpecialChar,
        "requireMfa": config.requireMfa,
      }
      const res: any = await companyService.updatePasswordConfig(updatedValue);
      showSnackbar(res.message, 'success')
    } catch (error) {
      showSnackbar("Failed to update password config", 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchPasswordConfig();
  }, []);

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center justify-between my-4">
        <div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
            <span className="text-primary font-medium">
              {getCurrentRouteLabel()}
            </span>
          </div>

          <div className="text-gray-500 text-[10px]">
            Configure authentication and password security settings
          </div>
        </div>

        <Chip
          color="success"
          label="Security Enabled"
          icon={<VerifiedUserIcon />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Password Rules */}
        <div>
          <Card className="rounded-2xl shadow-none border bg-white-50">
            <CardContent>
              <div className="flex items-center gap-2 mb-5">
                <PasswordIcon className="text-primary" />
                <Typography variant="h6" className="font-semibold text-gray-800">
                  Password Rules
                </Typography>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Password Length"
                  value={config.minPasswordLength}
                  onChange={(e) =>
                    handleChange(
                      "minPasswordLength",
                      Number(e.target.value)
                    )
                  }
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Password Expiry Days"
                  value={config.passwordExpiryDays}
                  onChange={(e) =>
                    handleChange(
                      "passwordExpiryDays",
                      Number(e.target.value)
                    )
                  }
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Expiry Reminder Days"
                  value={config.expiryReminderDays}
                  onChange={(e) =>
                    handleChange(
                      "expiryReminderDays",
                      Number(e.target.value)
                    )
                  }
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Max Invalid Login Attempts"
                  value={config.maxInvalidLoginAttempts}
                  onChange={(e) =>
                    handleChange(
                      "maxInvalidLoginAttempts",
                      Number(e.target.value)
                    )
                  }
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Welcome Password Expiry Days"
                  value={config.welcomePasswordExpiryDays}
                  onChange={(e) =>
                    handleChange(
                      "welcomePasswordExpiryDays",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            </CardContent>

            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 m-3">
              <WarningAmberIcon className="text-orange-500" />
              <div className="text-orange-700 text-[12px]">
                Strong password policies improve account security and reduce
                unauthorized access risks.
              </div>
            </div>
          </Card>
        </div>

        {/* Security Toggles */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card className="rounded-2xl shadow-none border h-full bg-white-50">
            <CardContent>
              <div className="flex items-center gap-2 mb-5">
                <SecurityIcon className="text-primary" />
                <Typography variant="h6" className="font-semibold text-gray-800">
                  Security Requirements
                </Typography>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div>
                    <Typography className="text-gray-800">
                      Require Uppercase
                    </Typography>
                    <Typography className="text-gray-800">
                      Password must contain capital letters
                    </Typography>
                  </div>

                  <Switch
                    checked={config.requireUppercase}
                    onChange={(e) =>
                      handleChange(
                        "requireUppercase",
                        e.target.checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div>
                    <Typography className="text-gray-800">
                      Require Lowercase
                    </Typography>
                    <Typography className="text-gray-800">
                      Password must contain lowercase letters
                    </Typography>
                  </div>

                  <Switch
                    checked={config.requireLowercase}
                    onChange={(e) =>
                      handleChange(
                        "requireLowercase",
                        e.target.checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div>
                    <Typography className="text-gray-800">
                      Require Digits
                    </Typography>
                    <Typography className="text-gray-800">
                      Password must contain numbers
                    </Typography>
                  </div>

                  <Switch
                    checked={config.requireDigit}
                    onChange={(e) =>
                      handleChange(
                        "requireDigit",
                        e.target.checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div>
                    <Typography className="text-gray-800">
                      Require Special Character
                    </Typography>
                    <Typography className="text-gray-800">
                      Password must contain special symbols
                    </Typography>
                  </div>

                  <Switch
                    checked={config.requireSpecialChar}
                    onChange={(e) =>
                      handleChange(
                        "requireSpecialChar",
                        e.target.checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between border rounded-xl p-3">
                  <div>
                    <Typography className="text-gray-800">
                      Enable MFA
                    </Typography>
                    <Typography className="text-gray-800">
                      Multi-factor authentication required
                    </Typography>
                  </div>

                  <Switch
                    checked={config.requireMfa}
                    onChange={(e) =>
                      handleChange("requireMfa", e.target.checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        {/* <Button variant="outlined" className="!text-gray-800 !border-gray-300">Cancel</Button> */}
        <Button variant="contained" className="!bg-primary" onClick={() => handleSave()}>
          Save Password Policy
        </Button>
      </div>
    </div>
  );
}