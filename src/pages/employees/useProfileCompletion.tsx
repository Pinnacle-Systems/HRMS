import { Box, Typography, CircularProgress, Tooltip, Chip } from "@mui/material";
import { CheckCircle, Warning, Info } from "@mui/icons-material";

// Helper function to check if a value is filled (not null, undefined, or empty)
const isFilled = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Define the employee profile structure
interface EmployeeProfile {
  // Personal Info
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  genderId?: string;
  bloodGroupId?: string;
  maritalStatusId?: string;
  nationalityId?: string;
  religionId?: string;
  identificationMark?: string;
  hobbies?: string;
  languagesKnown?: string;
  
  // Employment Info
  employeeId?: string;
  designationId?: string;
  departmentId?: string;
  branchId?: string;
  managerId?: string;
  joiningDate?: string;
  employeeStatusId?: string;
  gradeId?: string;
  empTypeId?: string;
  bandId?: string;
  probationPeriod?: number;
  noticePeriod?: number;
  
  // Documents
  aadhaarNumber?: string;
  panNumber?: string;
  passportNumber?: string;
  visaType?: string;
  visaExpiry?: string;
  universalAccountNumber?: string;
  pranNumber?: string;
  insuranceNumber?: string;
  
  // Financial
  bankAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  pfNumber?: string;
  esiNumber?: string;
  
  // Arrays
  addresses?: any[];
  attachments?: any[];
  emergencyContacts?: any[];
  familyMembers?: any[];
  nominations?: any[];
  pfAccounts?: any[];
  qualifications?: any[];
  previousEmployments?: any[];
  trainingDetails?: any[];
}

// Define the completion criteria
interface CompletionCriteria {
  fields: string[];
  weight: number;
  sectionName: string;
  requiredForHighProgress?: boolean;
}

export const getProfileCompletionProgress = (employee: EmployeeProfile | null): number => {
  if (!employee) return 0;

  // const totalWeight = 100;
  let completedWeight = 0;

  // Define all criteria with their weights
  const criteria: CompletionCriteria[] = [
    // Critical Personal Info - 15%
    {
      fields: [
        'firstName', 'lastName', 'emailAddress', 'mobileNumber',
        'genderId', 'dateOfBirth'
      ],
      weight: 15,
      sectionName: 'Basic Personal Info',
    },
    // Employment Info - 15%
    {
      fields: [
        'employeeId', 'designationId', 'departmentId', 'branchId',
        'managerId', 'joiningDate', 'employeeStatusId'
      ],
      weight: 15,
      sectionName: 'Employment Details',
    },
    // Identity Documents - 20%
    {
      fields: [
        'aadhaarNumber', 'panNumber',
        'universalAccountNumber', 'esiNumber'
      ],
      weight: 20,
      sectionName: 'Identity Documents',
    },
    // Financial Info - 10%
    {
      fields: [
        'bankAccountNumber', 'ifscCode', 'bankName',
        'pfNumber', 'esiNumber'
      ],
      weight: 10,
      sectionName: 'Financial Details',
    },
    // Additional Personal Info - 5%
    {
      fields: [
        'bloodGroupId', 'maritalStatusId', 'nationalityId',
        'religionId', 'languagesKnown', 'hobbies'
      ],
      weight: 10,
      sectionName: 'Additional Personal Info',
    },
  ];

  // Calculate completion for each criteria
  criteria.forEach(criterion => {
    const filledFields = criterion.fields.filter(field => {
      const value = (employee as any)[field];
      return isFilled(value);
    });
    
    const completionRatio = filledFields.length / criterion.fields.length;
    completedWeight += completionRatio * criterion.weight;
  });

  // Array sections - 15% total (distributed)
  const arraySections: { key: keyof EmployeeProfile; weight: number }[] = [
    { key: 'addresses', weight: 4 },
    { key: 'attachments', weight: 3 },
    { key: 'emergencyContacts', weight: 2 },
    { key: 'familyMembers', weight: 2 },
    { key: 'nominations', weight: 2 },
    { key: 'pfAccounts', weight: 1 },
    { key: 'qualifications', weight: 1 },
  ];

  arraySections.forEach(({ key, weight }) => {
    const value = employee[key];
    if (Array.isArray(value) && value.length > 0) {
      completedWeight += weight;
    }
  });

  // Round to nearest integer
  return Math.min(Math.round(completedWeight), 100);
};

// Get detailed breakdown of completion status
export const getProfileCompletionBreakdown = (employee: EmployeeProfile | null) => {
  if (!employee) return [];

  const breakdown: { section: string; completed: number; total: number; percentage: number; items: { field: string; filled: boolean }[] }[] = [];

  const sections = [
    {
      name: 'Basic Personal Info',
      fields: ['firstName', 'lastName', 'emailAddress', 'mobileNumber', 'genderId', 'dateOfBirth'],
    },
    {
      name: 'Employment Details',
      fields: ['employeeId', 'designationId', 'departmentId', 'branchId', 'managerId', 'joiningDate', 'employeeStatusId'],
    },
    {
      name: 'Identity Documents',
      fields: ['aadhaarNumber', 'panNumber', 'passportNumber', 'universalAccountNumber', 'pranNumber'],
    },
    {
      name: 'Financial Details',
      fields: ['bankAccountNumber', 'ifscCode', 'bankName', 'pfNumber', 'esiNumber'],
    },
    {
      name: 'Additional Personal Info',
      fields: ['bloodGroupId', 'maritalStatusId', 'nationalityId', 'religionId', 'languagesKnown', 'hobbies'],
    },
  ];

  sections.forEach(section => {
    const items = section.fields.map(field => ({
      field,
      filled: isFilled((employee as any)[field]),
    }));
    const completed = items.filter(item => item.filled).length;
    const total = items.length;
    const percentage = Math.round((completed / total) * 100);

    breakdown.push({
      section: section.name,
      completed,
      total,
      percentage,
      items,
    });
  });

  // Array sections
  const arraySections = [
    { name: 'Addresses', key: 'addresses' as keyof EmployeeProfile },
    { name: 'Attachments', key: 'attachments' as keyof EmployeeProfile },
    { name: 'Emergency Contacts', key: 'emergencyContacts' as keyof EmployeeProfile },
    { name: 'Family Members', key: 'familyMembers' as keyof EmployeeProfile },
    { name: 'Nominations', key: 'nominations' as keyof EmployeeProfile },
    { name: 'PF Accounts', key: 'pfAccounts' as keyof EmployeeProfile },
    { name: 'Qualifications', key: 'qualifications' as keyof EmployeeProfile },
  ];

  arraySections.forEach(({ name, key }) => {
    const value = employee[key];
    const filled = Array.isArray(value) && value.length > 0;
    breakdown.push({
      section: name,
      completed: filled ? 1 : 0,
      total: 1,
      percentage: filled ? 100 : 0,
      items: [{ field: name, filled }],
    });
  });

  return breakdown;
};

// Component to display profile completion progress
interface ProfileCompletionProgressProps {
  employee: EmployeeProfile | null;
  size?: number;
  showLabel?: boolean;
  showBreakdown?: boolean;
}

export const ProfileCompletionProgress = ({ 
  employee, 
  size = 80, 
  showLabel = true,
  showBreakdown = false,
}: ProfileCompletionProgressProps) => {
  const progress = getProfileCompletionProgress(employee);
  const breakdown = getProfileCompletionBreakdown(employee);

  const getProgressColor = (value: number) => {
    if (value >= 80) return '#22c55e !important'; // Green
    if (value >= 50) return '#f59e0b !important'; // Amber
    if (value >= 30) return '#f97316 !important'; // Orange
    return '#ef4444 !important'; // Red  
  };

  const getProgressText = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'In Progress';
    if (value >= 20) return 'Needs Attention';
    return 'Poor';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          enableTrackSlot
          value={progress}
          size={size}
          thickness={5}
          sx={{
            color: getProgressColor(progress),
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography
            variant="caption"
            component="div"
            className="text-gray-800"
            sx={{ fontWeight: 'bold', fontSize: size * 0.15 }}
          >
            {progress}%
          </Typography>
          {showLabel && (
            <Typography
              variant="caption"
              component="div"
              className="text-gray-800"
              sx={{ 
                fontSize: size * 0.12, 
                textAlign: 'center',
                lineHeight: 2,
              }}
            >
              {getProgressText(progress)}
            </Typography>
          )}
        </Box>
      </Box>

      {showBreakdown && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="subtitle2" className="font-semibold text-gray-800 mb-2">
            Profile Completion Details
          </Typography>
          <div className="space-y-2">
            {breakdown.map((section) => (
              <div key={section.section} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700">{section.section}</span>
                    <span className="text-gray-500">
                      {section.completed}/{section.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${section.percentage}%`,
                        backgroundColor: section.percentage === 100 ? '#22c55e' : '#3b82f6',
                      }}
                    />
                  </div>
                </div>
                <Chip
                  label={`${section.percentage}%`}
                  size="small"
                  className="!h-5 !text-[9px]"
                  color={section.percentage === 100 ? 'success' : 'default'}
                />
              </div>
            ))}
          </div>
        </Box>
      )}
    </Box>
  );
};

// Component for displaying profile completion status badges
export const ProfileCompletionBadge = ({ employee }: { employee: EmployeeProfile | null }) => {
  const progress = getProfileCompletionProgress(employee);

  const getStatus = () => {
    if (progress >= 80) return { label: 'Completed', color: 'success', icon: <CheckCircle className="!w-4" /> };
    if (progress >= 50) return { label: 'Partial', color: 'warning', icon: <Warning className="!w-4" /> };
    return { label: 'Poor', color: 'error', icon: <Info className="!w-4" /> };
  };

  const status = getStatus();

  return (
    <Tooltip title={`Profile is ${progress}% complete`}>
      <Chip
        icon={status.icon}
        label={`${progress}% Complete`}
        size="small"
        color={status.color as any}
        variant="outlined"
        className="font-medium"
      />
    </Tooltip>
  );
};

// Hook to get completion progress
export const useProfileCompletion = (employee: EmployeeProfile | null) => {
  const progress = getProfileCompletionProgress(employee);
  const breakdown = getProfileCompletionBreakdown(employee);
  
  const getMissingFields = (): string[] => {
    if (!employee) return [];
    const missing: string[] = [];
    
    const allFields = [
      'firstName', 'lastName', 'emailAddress', 'mobileNumber',
      'genderId', 'dateOfBirth', 'bloodGroupId', 'maritalStatusId',
      'nationalityId', 'religionId', 'languagesKnown', 'hobbies',
      'employeeId', 'designationId', 'departmentId', 'branchId',
      'managerId', 'joiningDate', 'employeeStatusId',
      'aadhaarNumber', 'panNumber', 'passportNumber',
      'universalAccountNumber', 'pranNumber',
      'bankAccountNumber', 'ifscCode', 'bankName', 'pfNumber', 'esiNumber'
    ];

    allFields.forEach(field => {
      const value = (employee as any)[field];
      if (!isFilled(value)) {
        missing.push(field);
      }
    });

    return missing;
  };

  return {
    progress,
    breakdown,
    missingFields: getMissingFields(),
    isComplete: progress >= 80,
    isPartial: progress >= 50 && progress < 80,
    isIncomplete: progress < 50,
  };
};