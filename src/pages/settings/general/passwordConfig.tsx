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
  IconButton,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import PasswordIcon from "@mui/icons-material/Password";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { getCurrentRouteLabel } from "../const";
import {
  passwordPolicyService,
  type PasswordPolicyRequest,
} from "../../../services/modules/passwordPolicy";
import { CancelOutlined } from "@mui/icons-material";

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
  const [draftPolicy, setDraftPolicy] = useState<PasswordPolicyRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPolicy() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await passwordPolicyService.getPasswordPolicy();
        if (isMounted) {
          setPolicy(response);
          setDraftPolicy(response);
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
      if (!draftPolicy) return;
      setDraftPolicy((current) => ({
        ...current!,
        [field]: Number(event.target.value),
      }));
      setSuccess(null);
    };

  const updateBooleanField =
    (field: BooleanPolicyField) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!draftPolicy) return;
      setDraftPolicy((current) => ({
        ...current!,
        [field]: event.target.checked,
      }));
      setSuccess(null);
    };

  const handleEdit = () => {
    setDraftPolicy({ ...policy });
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setDraftPolicy(null);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!draftPolicy) return;
    const validationError = getValidationError(draftPolicy);
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await passwordPolicyService.updatePasswordPolicy(draftPolicy);
      setPolicy(response);
      setDraftPolicy(response);
      setSuccess("Password policy saved successfully.");
      setIsEditing(false);
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
            {/* Password Rules Card */}
            <Card className="rounded-2xl shadow-none border bg-white-50 h-full">
              <CardContent>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <PasswordIcon className="text-primary" />
                    <Typography variant="h6" className="font-semibold text-gray-800">
                      Password Rules
                    </Typography>
                  </div>
                  {!isEditing && (
                    <IconButton 
                      onClick={handleEdit} 
                      size="small" 
                      className="text-gray-500 hover:text-primary"
                      disabled={isSaving}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>

                {isEditing ? (
                  // Edit mode - show form
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <TextField
                        fullWidth
                        type="number"
                        label="Minimum Password Length"
                        value={draftPolicy?.minPasswordLength ?? policy.minPasswordLength}
                        onChange={updateNumericField("minPasswordLength")}
                        disabled={isSaving}
                      />

                      <TextField
                        fullWidth
                        type="number"
                        label="Password Expiry Days"
                        value={draftPolicy?.passwordExpiryDays ?? policy.passwordExpiryDays}
                        onChange={updateNumericField("passwordExpiryDays")}
                        disabled={isSaving}
                      />

                      <TextField
                        fullWidth
                        type="number"
                        label="Expiry Reminder Days"
                        value={draftPolicy?.expiryReminderDays ?? policy.expiryReminderDays}
                        onChange={updateNumericField("expiryReminderDays")}
                        disabled={isSaving}
                      />

                      <TextField
                        fullWidth
                        type="number"
                        label="Max Invalid Login Attempts"
                        value={draftPolicy?.maxInvalidLoginAttempts ?? policy.maxInvalidLoginAttempts}
                        onChange={updateNumericField("maxInvalidLoginAttempts")}
                        disabled={isSaving}
                      />

                      <TextField
                        fullWidth
                        type="number"
                        label="Welcome Password Expiry Days"
                        value={draftPolicy?.welcomePasswordExpiryDays ?? policy.welcomePasswordExpiryDays}
                        onChange={updateNumericField("welcomePasswordExpiryDays")}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex justify-end gap-3 mt-5">
                      <Button
                        variant="outlined"
                        className="!text-gray-800 !border-gray-200"
                        onClick={handleCancel}
                        disabled={isSaving}
                        startIcon={<CancelOutlined className="!text-gray-400"/>}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        className="!bg-primary hover:!bg-primary-dark"
                        onClick={handleSave}
                        disabled={isSaving}
                        startIcon={<SaveIcon />}
                      >
                        {isSaving ? "Saving..." : "Save Policy"}
                      </Button>
                    </div>
                  </>
                ) : (
                  // View mode - show summary
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <Typography variant="body2" className="text-gray-600">
                          Minimum Length
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {policy.minPasswordLength} characters
                        </Typography>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <Typography variant="body2" className="text-gray-600">
                          Password Expiry
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {policy.passwordExpiryDays} days
                        </Typography>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <Typography variant="body2" className="text-gray-600">
                          Expiry Reminder
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {policy.expiryReminderDays} days before expiry
                        </Typography>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <Typography variant="body2" className="text-gray-600">
                          Max Invalid Attempts
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {policy.maxInvalidLoginAttempts} attempts
                        </Typography>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <Typography variant="body2" className="text-gray-600">
                          Welcome Password Expiry
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {policy.welcomePasswordExpiryDays} days
                        </Typography>
                      </div>
                      <div className="flex justify-between">
                        <Typography variant="body2" className="text-gray-600">
                          Requirements
                        </Typography>
                        <div className="flex gap-1 flex-wrap">
                          {policy.requireUppercase && <Chip label="Uppercase" size="small" color="primary" variant="outlined" />}
                          {policy.requireLowercase && <Chip label="Lowercase" size="small" color="primary" variant="outlined" />}
                          {policy.requireDigit && <Chip label="Digit" size="small" color="primary" variant="outlined" />}
                          {policy.requireSpecialChar && <Chip label="Special" size="small" color="primary" variant="outlined" />}
                          {policy.requireMfa && <Chip label="MFA" size="small" color="secondary" variant="outlined" />}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>

              {!isEditing && (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 m-3">
                  <WarningAmberIcon className="text-orange-500" />
                  <div className="text-orange-700 text-[12px]">
                    Strong password policies improve account security and reduce
                    unauthorized access risks.
                  </div>
                </div>
              )}
            </Card>

            {/* Security Toggles (always editable) */}
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
                        checked={isEditing ? (draftPolicy?.requireUppercase ?? policy.requireUppercase) : policy.requireUppercase}
                        onChange={updateBooleanField("requireUppercase")}
                        disabled={!isEditing}
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
                        checked={isEditing ? (draftPolicy?.requireLowercase ?? policy.requireLowercase) : policy.requireLowercase}
                        onChange={updateBooleanField("requireLowercase")}
                        disabled={!isEditing}
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
                        checked={isEditing ? (draftPolicy?.requireDigit ?? policy.requireDigit) : policy.requireDigit}
                        onChange={updateBooleanField("requireDigit")}
                        disabled={!isEditing}
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
                        checked={isEditing ? (draftPolicy?.requireSpecialChar ?? policy.requireSpecialChar) : policy.requireSpecialChar}
                        onChange={updateBooleanField("requireSpecialChar")}
                        disabled={!isEditing}
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
                        checked={isEditing ? (draftPolicy?.requireMfa ?? policy.requireMfa) : policy.requireMfa}
                        onChange={updateBooleanField("requireMfa")}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </div>
        </>
      )}
    </div>
  );
}