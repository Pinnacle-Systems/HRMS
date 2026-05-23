import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
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
    <div className="space-y-6">
      <div className="text-secondary mb-3 mt-3">
        Settings <KeyboardDoubleArrowRightIcon /> Password Config
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-secondary">
          <CircularProgress size={20} />
          <span>Loading password policy...</span>
        </div>
      ) : (
        <Grid container spacing={3}>
          {error && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          {success && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="success">{success}</Alert>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Password Length"
              value={policy.minPasswordLength}
              onChange={updateNumericField("minPasswordLength")}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Password Expiry (Days)"
              value={policy.passwordExpiryDays}
              onChange={updateNumericField("passwordExpiryDays")}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Expiry Reminder (Days)"
              value={policy.expiryReminderDays}
              onChange={updateNumericField("expiryReminderDays")}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Max Invalid Login Attempts"
              value={policy.maxInvalidLoginAttempts}
              onChange={updateNumericField("maxInvalidLoginAttempts")}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Welcome Password Expiry (Days)"
              value={policy.welcomePasswordExpiryDays}
              onChange={updateNumericField("welcomePasswordExpiryDays")}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider className="my-2" />
            <Typography variant="subtitle1" className="font-semibold mb-2">
              Password Requirements
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={policy.requireUppercase}
                  onChange={updateBooleanField("requireUppercase")}
                />
              }
              label="Require Uppercase"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={policy.requireLowercase}
                  onChange={updateBooleanField("requireLowercase")}
                />
              }
              label="Require Lowercase"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={policy.requireDigit}
                  onChange={updateBooleanField("requireDigit")}
                />
              }
              label="Require Numbers"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={policy.requireSpecialChar}
                  onChange={updateBooleanField("requireSpecialChar")}
                />
              }
              label="Require Special Characters"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={policy.requireMfa}
                  onChange={updateBooleanField("requireMfa")}
                />
              }
              label="Enable Two-Factor Authentication (2FA)"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              className="!bg-primary hover:!bg-primary-dark"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save Password Policy"}
            </Button>
          </Grid>
        </Grid>
      )}
    </div>
  );
}
