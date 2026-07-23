import React, { useState, useMemo } from 'react';
import { Alert, AlertTitle, IconButton } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { usePasswordPolicy } from '../context/PasswordPolicyContext';
import { useAuth } from '../auth/authContext';

export const PasswordExpiryAlert: React.FC = () => {
  const { session } = useAuth();
  const { policy, isLoading } = usePasswordPolicy();

  const [dismissed, setDismissed] = useState(false);

  const shouldShow = useMemo(() => {
    if (isLoading || !session) return false;

    const daysLeft = session.daysUntilPasswordExpiry;
    const reminderDays = policy?.expiryReminderDays;

    return (
      typeof daysLeft === 'number' &&
      daysLeft > 0 &&
      reminderDays &&
      reminderDays > 0 &&
      daysLeft <= reminderDays &&
      !dismissed
    );
  }, [isLoading, session, policy, dismissed]);

  if (!shouldShow) return null;

  const daysLeft = session?.daysUntilPasswordExpiry ?? 0;
  const message = `Your password will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Please change it soon.`;

  return (
    <div className="flex justify-center items-center">
      <Alert
        severity="error"
        variant="filled"
        className="!rounded-lg !p-0 !px-5 absolute top-[10px] z-[1202] animate-blink"
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={() => setDismissed(true)}
            aria-label="dismiss password expiry alert"
          >
            <CloseOutlined fontSize="inherit" />
          </IconButton>
        }
      >
        <AlertTitle className="!text-[10px]">⚠️ Password Expiry Reminder</AlertTitle>
        <div className="!text-[10px]">{message}</div>
      </Alert>
    </div>
  );
};