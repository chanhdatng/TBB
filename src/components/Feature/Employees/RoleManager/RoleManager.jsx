import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  IconButton,
  Badge,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Template as TemplateIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  Person as EmployeeIcon,
  Kitchen as ChefIcon,
  DeliveryDining as DeliveryIcon,
  CompareArrows as CompareIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  UploadFile as BulkIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionMatrix from './PermissionMatrix';
import RoleHistory from './RoleHistory';
import RoleTemplates from './RoleTemplates';

const ROLES = {
  ADMIN: { name: 'Admin', icon: AdminIcon, color: '#DC2626', description: 'Full system access' },
  MANAGER: { name: 'Manager', icon: ManagerIcon, color: '#2563EB', description: 'Store management' },
  CHEF: { name: 'Chef', icon: ChefIcon, color: '#059669', description: 'Kitchen operations' },
  DELIVERY: { name: 'Delivery', icon: DeliveryIcon, color: '#7C3AED', description: 'Delivery operations' },
  EMPLOYEE: { name: 'Employee', icon: EmployeeIcon, color: '#6B7280', description: 'Basic access' },
};

const PERMISSIONS = {
  DASHBOARD: { name: 'Dashboard', category: 'General' },
  ORDERS: { name: 'Orders', category: 'Sales' },
  KITCHEN: { name: 'Kitchen', category: 'Operations' },
  DELIVERY: { name: 'Delivery', category: 'Operations' },
  CUSTOMERS: { name: 'Customers', category: 'CRM' },
  PRODUCTS: { name: 'Products', category: 'Catalog' },
  REPORTS: { name: 'Reports', category: 'Analytics' },
  EMPLOYEES: { name: 'Employees', category: 'HR' },
  SETTINGS: { name: 'Settings', category: 'System' },
  FINANCIAL: { name: 'Financial', category: 'Admin' },
};

const ROLE_PERMISSIONS = {
  ADMIN: Object.keys(PERMISSIONS),
  MANAGER: ['DASHBOARD', 'ORDERS', 'KITCHEN', 'DELIVERY', 'CUSTOMERS', 'PRODUCTS', 'REPORTS', 'EMPLOYEES'],
  CHEF: ['DASHBOARD', 'ORDERS', 'KITCHEN', 'PRODUCTS'],
  DELIVERY: ['DASHBOARD', 'ORDERS', 'DELIVERY', 'CUSTOMERS'],
  EMPLOYEE: ['DASHBOARD', 'ORDERS'],
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const RoleManager = () => {
  const theme = useTheme();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [reason, setReason] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareRoles, setCompareRoles] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setEmployees([
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah@butterbake.com',
        currentRole: 'MANAGER',
        avatar: '/avatars/sarah.jpg',
        department: 'Operations',
        joinDate: '2023-01-15',
        lastRoleChange: '2023-06-01',
      },
      {
        id: 2,
        name: 'Mike Chen',
        email: 'mike@butterbake.com',
        currentRole: 'CHEF',
        avatar: '/avatars/mike.jpg',
        department: 'Kitchen',
        joinDate: '2023-03-20',
        lastRoleChange: null,
      },
      // Add more employees...
    ]);
  }, []);

  const handleRoleChange = (employeeId, newRole, reason) => {
    const employee = employees.find(e => e.id === employeeId);
    setPendingChange({ employee, newRole, reason });
    setConfirmDialogOpen(true);
  };

  const confirmRoleChange = () => {
    if (!pendingChange) return;

    const updatedEmployees = employees.map(emp =>
      emp.id === pendingChange.employee.id
        ? { ...emp, currentRole: pendingChange.newRole, lastRoleChange: new Date().toISOString() }
        : emp
    );

    setEmployees(updatedEmployees);
    setRoleDialogOpen(false);
    setConfirmDialogOpen(false);
    setPendingChange(null);
    setNotification({
      open: true,
      message: `Role updated for ${pendingChange.employee.name}`,
      severity: 'success',
    });

    // Log change (in real app, send to backend)
    console.log('Role change logged:', pendingChange);
  };

  const handleBulkRoleChange = (newRole, reason) => {
    if (selectedEmployees.length === 0) {
      setNotification({
        open: true,
        message: 'Please select employees to update',
        severity: 'warning',
      });
      return;
    }
    setPendingChange({ employees: selectedEmployees, newRole, reason });
    setConfirmDialogOpen(true);
  };

  const confirmBulkRoleChange = () => {
    if (!pendingChange?.employees) return;

    const updatedEmployees = employees.map(emp =>
      pendingChange.employees.includes(emp.id)
        ? { ...emp, currentRole: pendingChange.newRole, lastRoleChange: new Date().toISOString() }
        : emp
    );

    setEmployees(updatedEmployees);
    setSelectedEmployees([]);
    setBulkMode(false);
    setConfirmDialogOpen(false);
    setPendingChange(null);
    setNotification({
      open: true,
      message: `Updated ${pendingChange.employees.length} employees`,
      severity: 'success',
    });
  };

  const handleCompareRoles = (role1, role2) => {
    setCompareRoles([role1, role2]);
    setCompareMode(true);
  };

  const getRoleImpact = (currentRole, newRole) => {
    const currentPerms = new Set(ROLE_PERMISSIONS[currentRole] || []);
    const newPerms = new Set(ROLE_PERMISSIONS[newRole] || []);

    const gained = [...newPerms].filter(p => !currentPerms.has(p));
    const lost = [...currentPerms].filter(p => !newPerms.has(p));

    return { gained, lost, impact: gained.length - lost.length };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
              Role Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage employee roles and permissions
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant={bulkMode ? "contained" : "outlined"}
              startIcon={<PeopleIcon />}
              onClick={() => setBulkMode(!bulkMode)}
            >
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Update'}
            </Button>
            <Button
              variant={compareMode ? "contained" : "outlined"}
              startIcon={<CompareIcon />}
              onClick={() => setCompareMode(!compareMode)}
            >
              {compareMode ? 'Exit Compare' : 'Compare Roles'}
            </Button>
            <Button variant="outlined" startIcon={<ExportIcon />}>
              Export
            </Button>
          </Stack>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Object.entries(ROLES).map(([key, role]) => {
          const Icon = role.icon;
          const count = employees.filter(e => e.currentRole === key).length;

          return (
            <Grid item xs={12} sm={6} md={2.4} key={key}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * Object.keys(ROLES).indexOf(key) }}
              >
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: role.color }}>
                          <Icon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {role.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} {count === 1 ? 'member' : 'members'}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={ROLE_PERMISSIONS[key].length}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab icon={<PeopleIcon />} label="Employees" />
          <Tab icon={<AssignmentIcon />} label="Permission Matrix" />
          <Tab icon={<HistoryIcon />} label="Role History" />
          <Tab icon={<TemplateIcon />} label="Role Templates" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* Employees List */}
        {bulkMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select multiple employees to update their roles in bulk
          </Alert>
        )}

        {compareMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select two roles to compare their permissions
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {bulkMode && <TableCell padding="checkbox" />}
                <TableCell>Employee</TableCell>
                <TableCell>Current Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Last Changed</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => {
                const RoleIcon = ROLES[employee.currentRole]?.icon || EmployeeIcon;
                const roleColor = ROLES[employee.currentRole]?.color || '#6B7280';

                return (
                  <motion.tr
                    key={employee.id}
                    component={TableRow}
                    hover
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}
                  >
                    {bulkMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, employee.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                            }
                          }}
                        />
                      </TableCell>
                    )}

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={employee.avatar} alt={employee.name}>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {employee.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={<RoleIcon sx={{ fontSize: 16 }} />}
                        label={ROLES[employee.currentRole]?.name || 'Unknown'}
                        sx={{
                          bgcolor: roleColor,
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </TableCell>

                    <TableCell>{employee.department}</TableCell>

                    <TableCell>
                      {employee.lastRoleChange ? (
                        <Typography variant="body2">
                          {new Date(employee.lastRoleChange).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Never changed
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Change Role">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View History">
                          <IconButton size="small">
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>

                        {compareMode && (
                          <Tooltip title="Add to Compare">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (compareRoles.length < 2) {
                                  setCompareRoles([...compareRoles, employee.currentRole]);
                                }
                              }}
                              disabled={compareRoles.includes(employee.currentRole) || compareRoles.length >= 2}
                            >
                              <CompareIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bulk Actions */}
        {bulkMode && selectedEmployees.length > 0 && (
          <Paper sx={{ p: 2, mt: 2, position: 'sticky', bottom: 20, zIndex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body1">
                {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
              </Typography>
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Assign Role</InputLabel>
                  <Select
                    value=""
                    label="Assign Role"
                    onChange={(e) => {
                      setNewRole(e.target.value);
                      setRoleDialogOpen(true);
                    }}
                  >
                    {Object.entries(ROLES).map(([key, role]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <role.icon sx={{ fontSize: 20, color: role.color }} />
                          {role.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedEmployees([])}
                >
                  Clear Selection
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <PermissionMatrix />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <RoleHistory />
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <RoleTemplates onApply={handleBulkRoleChange} />
      </TabPanel>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Change Role
          {selectedEmployee && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedEmployee.name} - Current: {ROLES[selectedEmployee.currentRole]?.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Role</InputLabel>
            <Select
              value={newRole}
              label="New Role"
              onChange={(e) => setNewRole(e.target.value)}
            >
              {Object.entries(ROLES).map(([key, role]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <Avatar sx={{ bgcolor: role.color, width: 32, height: 32 }}>
                      <role.icon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {role.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {role.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedEmployee && newRole && newRole !== selectedEmployee.currentRole && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Permission Changes:
              </Typography>
              {(() => {
                const impact = getRoleImpact(selectedEmployee.currentRole, newRole);
                return (
                  <Stack spacing={1}>
                    {impact.gained.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="success.main">
                          + {impact.gained.length} new permissions
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {impact.gained.map(perm => (
                            <Chip key={perm} label={PERMISSIONS[perm]?.name} size="small" color="success" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {impact.lost.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="error.main">
                          - {impact.lost.length} permissions removed
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {impact.lost.map(perm => (
                            <Chip key={perm} label={PERMISSIONS[perm]?.name} size="small" color="error" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                );
              })()}
            </Box>
          )}

          <TextField
            fullWidth
            label="Reason for Change"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (bulkMode && selectedEmployees.length > 0) {
                handleBulkRoleChange(newRole, reason);
              } else if (selectedEmployee) {
                handleRoleChange(selectedEmployee.id, newRole, reason);
              }
            }}
            variant="contained"
            disabled={!newRole || !reason}
          >
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
            <WarningIcon />
            Confirm Role Change
          </Box>
        </DialogTitle>
        <DialogContent>
          {pendingChange?.employee ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to change {pendingChange.employee.name}'s role?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From: <strong>{ROLES[pendingChange.employee.currentRole]?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                To: <strong>{ROLES[pendingChange.newRole]?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Reason: {pendingChange.reason}
              </Typography>
            </Box>
          ) : pendingChange?.employees ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to change roles for {pendingChange.employees.length} employees?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New role: <strong>{ROLES[pendingChange.newRole]?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Reason: {pendingChange.reason}
              </Typography>
            </Box>
          ) : null}

          <Alert severity="warning" sx={{ mt: 2 }}>
            This action will be logged and cannot be undone. Employees will be notified of the change.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={pendingChange?.employee ? confirmRoleChange : confirmBulkRoleChange}
            variant="contained"
            color="warning"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Comparison Dialog */}
      {compareMode && compareRoles.length === 2 && (
        <Dialog open={true} onClose={() => setCompareMode(false)} maxWidth="md" fullWidth>
          <DialogTitle>Role Comparison</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {compareRoles.map((roleKey, index) => (
                <Grid item xs={6} key={roleKey}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: ROLES[roleKey]?.color }}>
                          <ROLES[roleKey]?.icon />
                        </Avatar>
                        <Typography variant="h6">{ROLES[roleKey]?.name}</Typography>
                      </Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Permissions ({ROLE_PERMISSIONS[roleKey]?.length}):
                      </Typography>
                      <Stack spacing={0.5}>
                        {ROLE_PERMISSIONS[roleKey]?.map(perm => {
                          const otherRolePerms = ROLE_PERMISSIONS[compareRoles[1 - index]] || [];
                          const hasInOther = otherRolePerms.includes(perm);
                          return (
                            <Chip
                              key={perm}
                              label={PERMISSIONS[perm]?.name}
                              size="small"
                              color={hasInOther ? "default" : "primary"}
                              variant={hasInOther ? "outlined" : "filled"}
                            />
                          );
                        })}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompareMode(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

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

export default RoleManager;