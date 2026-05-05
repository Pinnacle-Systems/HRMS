import { useState } from "react";
import { Typography, TextField, Grid, Switch, FormControlLabel, Divider } from "@mui/material";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

export default function PasswordConfig() {
  const [passwordConfigs, setPasswordConfig] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90,
    twoFactorAuth: false,
  });

  return (
    <div className="space-y-6">
      <div className="text-secondary mb-3 mt-3">Settings <KeyboardDoubleArrowRightIcon/> Password Config</div>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Minimum Password Length"
            value={passwordConfigs.minLength}
            onChange={(e) => setPasswordConfig({ ...passwordConfigs, minLength: parseInt(e.target.value) })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Password Expiry (Days)"
            value={passwordConfigs.expiryDays}
            onChange={(e) => setPasswordConfig({ ...passwordConfigs, expiryDays: parseInt(e.target.value) })}
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
                checked={passwordConfigs.requireUppercase}
                onChange={(e) => setPasswordConfig({ ...passwordConfigs, requireUppercase: e.target.checked })}
              />
            }
            label="Require Uppercase"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={passwordConfigs.requireLowercase}
                onChange={(e) => setPasswordConfig({ ...passwordConfigs, requireLowercase: e.target.checked })}
              />
            }
            label="Require Lowercase"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={passwordConfigs.requireNumbers}
                onChange={(e) => setPasswordConfig({ ...passwordConfigs, requireNumbers: e.target.checked })}
              />
            }
            label="Require Numbers"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={passwordConfigs.requireSpecialChars}
                onChange={(e) => setPasswordConfig({ ...passwordConfigs, requireSpecialChars: e.target.checked })}
              />
            }
            label="Require Special Characters"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={passwordConfigs.twoFactorAuth}
                onChange={(e) => setPasswordConfig({ ...passwordConfigs, twoFactorAuth: e.target.checked })}
              />
            }
            label="Enable Two-Factor Authentication (2FA)"
          />
        </Grid>
      </Grid>
    </div>
  );
}