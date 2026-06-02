import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { PolicyWizard } from '../../components/PolicyManagement/policyWizard/policyWizard';

export default function CreatePolicy()  {
  const navigate = useNavigate();
  const companyId = 'company_123'; // Should come from auth context

  const handleComplete = (policyId: string) => {
    navigate(`/policies/${policyId}`);
  };

  const handleCancel = () => {
    navigate('/policies');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link color="inherit" href="/policies" onClick={(e) => { e.preventDefault(); navigate('/policies'); }}>
            Policies
          </Link>
          <Typography color="text.primary">Create Policy</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
          Create New Policy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define a new policy by selecting a template and configuring rules, eligibility, and approval workflows.
        </Typography>
      </Box>

      <PolicyWizard
        companyId={companyId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </Container>
  );
};