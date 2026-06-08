import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { PolicyWizard } from '../../components/PolicyManagement/policyWizard/policyWizard';

export default function CreatePolicy() {
  const navigate = useNavigate();
  const location = useLocation();

  const companyId = location.state?.companyId;
  const policyName = location.state?.policyName;
  // const categoryId = location.state?.categoryId;

  const handleComplete = (policyId: string) => {
    navigate(`/policies/${policyId}`);
  };

  const handleCancel = () => {
    navigate('/policies');
  };

  return (
    <div>
      <div>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" className='text-primary' />} aria-label="breadcrumb" sx={{ mb: 2, ml: 2 }}>
          <Link color="inherit" href="/policies" className='!text-gray-500' onClick={(e) => { e.preventDefault(); navigate('/policies'); }}>
            Policies
          </Link>
          <Typography color="text.primary" className='text-gray-500'>Create Policy</Typography>
        </Breadcrumbs>
      </div>

      <PolicyWizard
        companyId={companyId}
        onComplete={handleComplete}
        onCancel={handleCancel}
        domain={policyName}
      />
    </div>
  );
};