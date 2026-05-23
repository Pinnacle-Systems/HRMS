import { useEffect, useState } from "react";
import {
  Alert,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Switch,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import PasswordIcon from "@mui/icons-material/Password";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { getCurrentRouteLabel } from "../const";
import {
  passwordPolicyService,
  type PasswordPolicyRequest,
} from "../../../services/modules/passwordPolicy";

const defaultPolicy: PasswordPolicyRequest = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  passwordExpiryDays: 90,
  expiryReminderDays: 7,
  maxInvalidLoginAttempts: 5,
  welcomePasswordExpiryDays: 7,
  requireMfa: false,
};

type NumericPolicyField =
  | "minPasswordLength"
  | "passwordExpiryDays"
  | "expiryReminderDays"
  | "maxInvalidLoginAttempts"
  | "welcomePasswordExpiryDays";

type BooleanPolicyField =
  | "requireUppercase"
  | "requireLowercase"
  | "requireDigit"
  | "requireSpecialChar"
  | "requireMfa";

function getValidationError(policy: PasswordPolicyRequest): string | null {
  if (policy.minPasswordLength <= 0) {
    return "Minimum password length should be positive.";
  }

  if (
    policy.passwordExpiryDays > 0 &&
    policy.expiryReminderDays > policy.passwordExpiryDays
  ) {
    return "Expiry reminder days should not exceed password expiry days.";
  }

  if (policy.maxInvalidLoginAttempts <= 0) {
    return "Maximum invalid login attempts should be positive.";
  }

  if (policy.welcomePasswordExpiryDays <= 0) {
    return "Welcome password expiry days should be positive.";
  }

  return null;
}

export default function PasswordConfig() {
  const [policy, setPolicy] = useState<PasswordPolicyRequest>(defaultPolicy);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPolicy() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await passwordPolicyService.getPasswordPolicy();
        if (isMounted) {
          setPolicy(response);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load password policy.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPolicy();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateNumericField =
    (field: NumericPolicyField) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPolicy((current) => ({
        ...current,
        [field]: Number(event.target.value),
      }));
      setSuccess(null);
    };

  const updateBooleanField =
    (field: BooleanPolicyField) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPolicy((current) => ({
        ...current,
        [field]: event.target.checked,
      }));
      setSuccess(null);
    };

  const handleSave = async () => {
    const validationError = getValidationError(policy);
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await passwordPolicyService.updatePasswordPolicy(policy);
      setPolicy(response);
      setSuccess("Password policy saved successfully.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save password policy.",
      );
    } finally {
      setIsSaving(false);
    }
  };

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

      {isLoading ? (
        <div className="flex items-center gap-2 text-secondary mt-4">
          <CircularProgress size={20} />
          <span>Loading password policy...</span>
        </div>
      ) : (
        <>
          {error && <Alert severity="error" className="mb-4">{error}</Alert>}
          {success && <Alert severity="success" className="mb-4">{success}</Alert>}

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
                      value={policy.minPasswordLength}
                      onChange={updateNumericField("minPasswordLength")}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Password Expiry Days"
                      value={policy.passwordExpiryDays}
                      onChange={updateNumericField("passwordExpiryDays")}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Expiry Reminder Days"
                      value={policy.expiryReminderDays}
                      onChange={updateNumericField("expiryReminderDays")}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Max Invalid Login Attempts"
                      value={policy.maxInvalidLoginAttempts}
                      onChange={updateNumericField("maxInvalidLoginAttempts")}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Welcome Password Expiry Days"
                      value={policy.welcomePasswordExpiryDays}
                      onChange={updateNumericField("welcomePasswordExpiryDays")}
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
                        slotProps={{ input: { "aria-label": "Require Uppercase" } }}
                        checked={policy.requireUppercase}
                        onChange={updateBooleanField("requireUppercase")}
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
                        slotProps={{ input: { "aria-label": "Require Lowercase" } }}
                        checked={policy.requireLowercase}
                        onChange={updateBooleanField("requireLowercase")}
                      />
                    </div>

                    <div className="flex items-center justify-between border rounded-xl p-3">
                      <div>
                        <Typography className="text-gray-800">
                          Require Numbers
                        </Typography>
                        <Typography className="text-gray-800">
                          Password must contain numbers
                        </Typography>
                      </div>

                      <Switch
                        slotProps={{ input: { "aria-label": "Require Numbers" } }}
                        checked={policy.requireDigit}
                        onChange={updateBooleanField("requireDigit")}
                      />
                    </div>

                    <div className="flex items-center justify-between border rounded-xl p-3">
                      <div>
                        <Typography className="text-gray-800">
                          Require Special Characters
                        </Typography>
                        <Typography className="text-gray-800">
                          Password must contain special symbols
                        </Typography>
                      </div>

                      <Switch
                        slotProps={{ input: { "aria-label": "Require Special Characters" } }}
                        checked={policy.requireSpecialChar}
                        onChange={updateBooleanField("requireSpecialChar")}
                      />
                    </div>

                    <div className="flex items-center justify-between border rounded-xl p-3">
                      <div>
                        <Typography className="text-gray-800">
                          Enable Two-Factor Authentication
                        </Typography>
                        <Typography className="text-gray-800">
                          Multi-factor authentication required
                        </Typography>
                      </div>

                      <Switch
                        slotProps={{ input: { "aria-label": "Enable Two-Factor Authentication" } }}
                        checked={policy.requireMfa}
                        onChange={updateBooleanField("requireMfa")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="contained" 
              className="!bg-primary hover:!bg-primary-dark" 
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save Password Policy"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
