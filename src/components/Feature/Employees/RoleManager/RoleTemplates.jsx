import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PersonAdd as NewHireIcon,
  TrendingUp as PromotionIcon,
  SwapHoriz as TransferIcon,
  School as TrainingIcon,
  Work as SeasonalIcon,
  Event as TempIcon,
  Business as DepartmentIcon,
  Star as SpecialIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ROLES = {
  ADMIN: { name: 'Admin', icon: '👑', color: '#DC2626' },
  MANAGER: { name: 'Manager', icon: '👔', color: '#2563EB' },
  CHEF: { name: 'Chef', icon: '👨‍🍳', color: '#059669' },
  DELIVERY: { name: 'Delivery', icon: '🚚', color: '#7C3AED' },
  EMPLOYEE: { name: 'Employee', icon: '👤', color: '#6B7280' },
};

const ROLE_TEMPLATES = [
  {
    id: 'new_hire_cashier',
    name: 'New Hire - Cashier',
    description: 'Standard role for new cashier employees',
    category: 'Onboarding',
    icon: NewHireIcon,
    color: '#10B981',
    targetRole: 'EMPLOYEE',
    permissions: ['DASHBOARD', 'ORDERS'],
    duration: '90 days',
    autoTransition: true,
    transitionTo: 'EMPLOYEE',
    features: [
      'Limited dashboard access',
      'Create and view orders',
      'Customer information access',
      'Basic training module included'
    ],
    settings: {
      requiresApproval: true,
      notifyManager: true,
      trainingRequired: true,
      probationPeriod: true,
    }
  },
  {
    id: 'new_hire_kitchen',
    name: 'New Hire - Kitchen Staff',
    description: 'Entry level position for kitchen operations',
    category: 'Onboarding',
    icon: NewHireIcon,
    color: '#10B981',
    targetRole: 'CHEF',
    permissions: ['DASHBOARD', 'ORDERS', 'KITCHEN'],
    duration: '90 days',
    autoTransition: true,
    transitionTo: 'CHEF',
    features: [
      'Kitchen dashboard access',
      'Order management',
      'Basic inventory tracking',
      'Food safety training included'
    ],
    settings: {
      requiresApproval: true,
      notifyManager: true,
      trainingRequired: true,
      probationPeriod: true,
    }
  },
  {
    id: 'promotion_assistant_manager',
    name: 'Promotion - Assistant Manager',
    description: 'Promotion track for junior to assistant manager',
    category: 'Promotion',
    icon: PromotionIcon,
    color: '#3B82F6',
    targetRole: 'MANAGER',
    permissions: ['DASHBOARD', 'ORDERS', 'KITCHEN', 'DELIVERY', 'CUSTOMERS', 'PRODUCTS', 'REPORTS'],
    duration: '180 days',
    autoTransition: true,
    transitionTo: 'MANAGER',
    features: [
      'Extended dashboard with analytics',
      'Team management capabilities',
      'Schedule creation and editing',
      'Basic reporting access',
      'Leadership training program'
    ],
    settings: {
      requiresApproval: true,
      notifyHR: true,
      notifySeniorManagement: true,
      trainingRequired: true,
      performanceReviewRequired: true,
    }
  },
  {
    id: 'transfer_to_delivery',
    name: 'Transfer - To Delivery Team',
    description: 'Department transfer to delivery operations',
    category: 'Transfer',
    icon: TransferIcon,
    color: '#8B5CF6',
    targetRole: 'DELIVERY',
    permissions: ['DASHBOARD', 'ORDERS', 'DELIVERY', 'CUSTOMERS'],
    duration: '30 days',
    autoTransition: true,
    transitionTo: 'DELIVERY',
    features: [
      'Delivery route management',
      'Order tracking system',
      'Customer communication tools',
      'GPS tracking access'
    ],
    settings: {
      requiresApproval: true,
      notifyCurrentManager: true,
      notifyNewManager: true,
      trainingRequired: true,
      handoverPeriod: true,
    }
  },
  {
    id: 'seasonal_staff',
    name: 'Seasonal Staff',
    description: 'Temporary role for seasonal employment',
    category: 'Temporary',
    icon: SeasonalIcon,
    color: '#F59E0B',
    targetRole: 'EMPLOYEE',
    permissions: ['DASHBOARD', 'ORDERS'],
    duration: 'Flexible',
    autoTransition: false,
    transitionTo: null,
    features: [
      'Time-limited access',
      'Basic order processing',
      'Seasonal product training',
      'Flexible scheduling'
    ],
    settings: {
      requiresApproval: true,
      endDateRequired: true,
      autoDeactivate: true,
      notifyManager: true,
    }
  },
  {
    id: 'trainee_management',
    name: 'Management Trainee',
    description: 'Training program for future managers',
    category: 'Training',
    icon: TrainingIcon,
    color: '#6366F1',
    targetRole: 'MANAGER',
    permissions: ['DASHBOARD', 'ORDERS', 'KITCHEN', 'DELIVERY', 'CUSTOMERS', 'PRODUCTS', 'REPORTS', 'EMPLOYEES'],
    duration: '365 days',
    autoTransition: false,
    transitionTo: 'MANAGER',
    features: [
      'Comprehensive management access',
      'Financial reporting',
      'Staff management',
      'Business analytics',
      'Strategic planning tools'
    ],
    settings: {
      requiresApproval: true,
      notifyHR: true,
      notifySeniorManagement: true,
      mentorshipRequired: true,
      quarterlyReviews: true,
      finalAssessment: true,
    }
  },
  {
    id: 'temporary_cover',
    name: 'Temporary Cover',
    description: 'Short-term role coverage',
    category: 'Temporary',
    icon: TempIcon,
    color: '#EC4899',
    targetRole: null, // Flexible based on need
    permissions: [],
    duration: 'Flexible',
    autoTransition: false,
    transitionTo: null,
    features: [
      'Role-specific permissions',
      'Time-limited access',
      'Quick setup process',
      'Automatic deactivation'
    ],
    settings: {
      requiresApproval: false,
      emergencyAccess: true,
      notifyReplacement: true,
    }
  },
  {
    id: 'department_transfer_ops',
    name: 'Transfer - Operations Team',
    description: 'Transfer to operations department',
    category: 'Transfer',
    icon: DepartmentIcon,
    color: '#14B8A6',
    targetRole: 'MANAGER',
    permissions: ['DASHBOARD', 'ORDERS', 'KITCHEN', 'DELIVERY', 'INVENTORY', 'REPORTS', 'SCHEDULE'],
    duration: '60 days',
    autoTransition: true,
    transitionTo: 'MANAGER',
    features: [
      'Operations dashboard',
      'Inventory management',
      'Staff scheduling',
      'Performance tracking',
      'Process optimization tools'
    ],
    settings: {
      requiresApproval: true,
      notifyBothManagers: true,
      trainingRequired: true,
      shadowingPeriod: true,
    }
  },
  {
    id: 'special_project_lead',
    name: 'Special Project Lead',
    description: 'Temporary leadership role for special projects',
    category: 'Special',
    icon: SpecialIcon,
    color: '#F97316',
    targetRole: 'MANAGER',
    permissions: ['DASHBOARD', 'ORDERS', 'PRODUCTS', 'REPORTS', 'ANALYTICS'],
    duration: 'Project-based',
    autoTransition: false,
    transitionTo: null,
    features: [
      'Project management tools',
      'Team coordination',
      'Budget tracking',
      'Progress reporting',
      'Cross-department access'
    ],
    settings: {
      requiresApproval: true,
      projectApproval: true,
      budgetLimit: true,
      milestoneReporting: true,
    }
  },
];

const RoleTemplates = ({ onApply }) => {
  const theme = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [customTemplateDialogOpen, setCustomTemplateDialogOpen] = useState(false);
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    targetRole: '',
    permissions: [],
    duration: '',
    features: [],
  });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['all', 'Onboarding', 'Promotion', 'Transfer', 'Temporary', 'Training', 'Special'];

  const filteredTemplates = filterCategory === 'all'
    ? ROLE_TEMPLATES
    : ROLE_TEMPLATES.filter(t => t.category === filterCategory);

  const handleApplyTemplate = (template, employees = []) => {
    if (onApply) {
      onApply({
        role: template.targetRole,
        reason: `Applied template: ${template.name} - ${template.description}`,
        template: template,
        employees: employees
      });
    }

    setNotification({
      open: true,
      message: `Template "${template.name}" applied successfully`,
      severity: 'success',
    });
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Onboarding': return <PersonAddIcon />;
      case 'Promotion': return <PromotionIcon />;
      case 'Transfer': return <TransferIcon />;
      case 'Temporary': return <ScheduleIcon />;
      case 'Training': return <TrainingIcon />;
      case 'Special': return <SpecialIcon />;
      default: return <SettingsIcon />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Role Templates
      </Typography>

      {/* Category Filter */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {categories.map((category) => (
          <Button
            key={category}
            variant={filterCategory === category ? 'contained' : 'outlined'}
            size="small"
            startIcon={getCategoryIcon(category)}
            onClick={() => setFilterCategory(category)}
            sx={{ textTransform: 'capitalize' }}
          >
            {category}
          </Button>
        ))}
      </Stack>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const TargetRoleIcon = template.targetRole ? ROLES[template.targetRole]?.icon : null;

          return (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: `2px solid transparent`,
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      borderColor: template.color,
                    }
                  }}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Avatar sx={{ bgcolor: template.color, mr: 2 }}>
                        <Icon />
                      </Avatar>
                      <Chip
                        label={template.category}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {template.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      {template.description}
                    </Typography>

                    {template.targetRole && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Target Role:
                        </Typography>
                        <Chip
                          icon={TargetRoleIcon}
                          label={ROLES[template.targetRole]?.name}
                          size="small"
                          sx={{
                            bgcolor: ROLES[template.targetRole]?.color,
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' }
                          }}
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Duration:
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {template.duration}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<PreviewIcon />}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setPreviewDialogOpen(true);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        onClick={() => handleApplyTemplate(template)}
                        disabled={!template.targetRole}
                      >
                        Apply
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Custom Template */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setCustomTemplateDialogOpen(true)}
        >
          Create Custom Template
        </Button>
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTemplate && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: selectedTemplate.color }}>
                  <selectedTemplate.icon />
                </Avatar>
                {selectedTemplate.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedTemplate.description}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Template Details
                  </Typography>
                  <List dense>
                    {selectedTemplate.targetRole && (
                      <ListItem>
                        <ListItemText
                          primary="Target Role"
                          secondary={ROLES[selectedTemplate.targetRole]?.name}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText
                        primary="Category"
                        secondary={selectedTemplate.category}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Duration"
                        secondary={selectedTemplate.duration}
                      />
                    </ListItem>
                    {selectedTemplate.autoTransition && (
                      <ListItem>
                        <ListItemText
                          primary="Auto-transition"
                          secondary={`To ${ROLES[selectedTemplate.transitionTo]?.name}`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Settings
                  </Typography>
                  <List dense>
                    {Object.entries(selectedTemplate.settings).map(([key, value]) => (
                      <ListItem key={key}>
                        <ListItemIcon>
                          {value ? <CheckIcon color="success" /> : <CancelIcon color="error" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={key.replace(/([A-Z])/g, ' $1').trim()}
                          secondary={value ? 'Enabled' : 'Disabled'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Features
                  </Typography>
                  <List dense>
                    {selectedTemplate.features.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                {selectedTemplate.permissions.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Permissions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedTemplate.permissions.map(perm => (
                        <Chip
                          key={perm}
                          label={perm}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewDialogOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleApplyTemplate(selectedTemplate);
                  setPreviewDialogOpen(false);
                }}
                disabled={!selectedTemplate.targetRole}
              >
                Apply Template
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Custom Template Dialog */}
      <Dialog
        open={customTemplateDialogOpen}
        onClose={() => setCustomTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={customTemplate.name}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={customTemplate.description}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Target Role"
                value={customTemplate.targetRole}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, targetRole: e.target.value }))}
              >
                {Object.entries(ROLES).map(([key, role]) => (
                  <MenuItem key={key} value={key}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration"
                value={customTemplate.duration}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, duration: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            Custom templates will be saved and can be reused for future role assignments.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomTemplateDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleTemplates;