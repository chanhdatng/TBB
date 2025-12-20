import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Badge,
  Alert,
  useTheme,
  alpha,
  Stack,
  Collapse,
  IconButton as MuiIconButton,
} from '@mui/material';
import {
  ViewModule as ViewModuleIcon,
  GridOn as GridIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  Create as CreateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ROLES = {
  ADMIN: { name: 'Admin', icon: '👑', color: '#DC2626' },
  MANAGER: { name: 'Manager', icon: '👔', color: '#2563EB' },
  CHEF: { name: 'Chef', icon: '👨‍🍳', color: '#059669' },
  DELIVERY: { name: 'Delivery', icon: '🚚', color: '#7C3AED' },
  EMPLOYEE: { name: 'Employee', icon: '👤', color: '#6B7280' },
};

const PERMISSIONS = {
  // General
  DASHBOARD: {
    name: 'Dashboard',
    category: 'General',
    description: 'View main dashboard',
    icon: '📊',
    levels: ['view', 'edit']
  },

  // Sales
  ORDERS: {
    name: 'Orders',
    category: 'Sales',
    description: 'Manage customer orders',
    icon: '📦',
    levels: ['view', 'create', 'edit', 'delete', 'approve']
  },

  // Operations
  KITCHEN: {
    name: 'Kitchen',
    category: 'Operations',
    description: 'Kitchen operations',
    icon: '🍳',
    levels: ['view', 'create', 'edit', 'manage']
  },
  DELIVERY: {
    name: 'Delivery',
    category: 'Operations',
    description: 'Delivery management',
    icon: '🛵',
    levels: ['view', 'assign', 'track', 'manage']
  },
  INVENTORY: {
    name: 'Inventory',
    category: 'Operations',
    description: 'Stock management',
    icon: '📋',
    levels: ['view', 'create', 'edit', 'adjust']
  },

  // CRM
  CUSTOMERS: {
    name: 'Customers',
    category: 'CRM',
    description: 'Customer management',
    icon: '👥',
    levels: ['view', 'create', 'edit', 'delete', 'export']
  },

  // Catalog
  PRODUCTS: {
    name: 'Products',
    category: 'Catalog',
    description: 'Product management',
    icon: '🧁',
    levels: ['view', 'create', 'edit', 'delete', 'publish']
  },
  CATEGORIES: {
    name: 'Categories',
    category: 'Catalog',
    description: 'Category management',
    icon: '📂',
    levels: ['view', 'create', 'edit', 'delete']
  },

  // Analytics
  REPORTS: {
    name: 'Reports',
    category: 'Analytics',
    description: 'View reports',
    icon: '📈',
    levels: ['view', 'create', 'export', 'schedule']
  },
  ANALYTICS: {
    name: 'Analytics',
    category: 'Analytics',
    description: 'Business analytics',
    icon: '📊',
    levels: ['view', 'advanced', 'export']
  },

  // HR
  EMPLOYEES: {
    name: 'Employees',
    category: 'HR',
    description: 'Employee management',
    icon: '👨‍💼',
    levels: ['view', 'create', 'edit', 'delete', 'manage_roles']
  },
  SCHEDULE: {
    name: 'Schedule',
    category: 'HR',
    description: 'Work schedule',
    icon: '📅',
    levels: ['view', 'create', 'edit', 'approve']
  },

  // System
  SETTINGS: {
    name: 'Settings',
    category: 'System',
    description: 'System settings',
    icon: '⚙️',
    levels: ['view', 'edit', 'advanced']
  },
  FINANCIAL: {
    name: 'Financial',
    category: 'System',
    description: 'Financial data',
    icon: '💰',
    levels: ['view', 'edit', 'approve', 'report']
  },
  SYSTEM: {
    name: 'System Admin',
    category: 'System',
    description: 'System administration',
    icon: '🛡️',
    levels: ['view', 'edit', 'backup', 'restore']
  },
};

// Define default permission levels for each role
const ROLE_PERMISSION_MATRIX = {
  ADMIN: Object.keys(PERMISSIONS).reduce((acc, perm) => {
    acc[perm] = PERMISSIONS[perm].levels;
    return acc;
  }, {}),

  MANAGER: {
    DASHBOARD: ['view', 'edit'],
    ORDERS: ['view', 'create', 'edit', 'approve'],
    KITCHEN: ['view', 'manage'],
    DELIVERY: ['view', 'manage'],
    INVENTORY: ['view', 'create', 'edit'],
    CUSTOMERS: ['view', 'create', 'edit', 'export'],
    PRODUCTS: ['view', 'create', 'edit', 'publish'],
    CATEGORIES: ['view', 'create', 'edit'],
    REPORTS: ['view', 'create', 'export', 'schedule'],
    ANALYTICS: ['view', 'advanced', 'export'],
    EMPLOYEES: ['view', 'create', 'edit'],
    SCHEDULE: ['view', 'create', 'edit', 'approve'],
    SETTINGS: ['view', 'edit'],
  },

  CHEF: {
    DASHBOARD: ['view'],
    ORDERS: ['view'],
    KITCHEN: ['view', 'create', 'edit', 'manage'],
    INVENTORY: ['view'],
    PRODUCTS: ['view'],
    REPORTS: ['view'],
    SCHEDULE: ['view', 'edit'],
  },

  DELIVERY: {
    DASHBOARD: ['view'],
    ORDERS: ['view'],
    DELIVERY: ['view', 'assign', 'track'],
    CUSTOMERS: ['view'],
    REPORTS: ['view'],
    SCHEDULE: ['view', 'edit'],
  },

  EMPLOYEE: {
    DASHBOARD: ['view'],
    ORDERS: ['view', 'create'],
    SCHEDULE: ['view', 'edit'],
  },
};

const PermissionMatrix = () => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState('matrix'); // matrix, list, details
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [editMode, setEditMode] = useState(false);
  const [tempMatrix, setTempMatrix] = useState(ROLE_PERMISSION_MATRIX);
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(Object.values(PERMISSIONS).reduce((acc, p) => {
      acc[p.category] = true;
      return acc;
    }, {}))
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const getPermissionIcon = (level) => {
    switch(level) {
      case 'view': return <VisibilityIcon sx={{ fontSize: 16 }} />;
      case 'create': return <CreateIcon sx={{ fontSize: 16 }} />;
      case 'edit': return <EditIcon sx={{ fontSize: 16 }} />;
      case 'delete': return <DeleteIcon sx={{ fontSize: 16 }} />;
      default: return <CheckIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      view: theme.palette.info.main,
      create: theme.palette.success.main,
      edit: theme.palette.warning.main,
      delete: theme.palette.error.main,
      approve: theme.palette.primary.main,
      manage: theme.palette.secondary.main,
      advanced: theme.palette.purple.main,
      export: theme.palette.teal.main,
    };
    return colors[level] || theme.palette.grey[500];
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const hasPermission = (role, permission, level) => {
    return tempMatrix[role]?.[permission]?.includes(level) || false;
  };

  const togglePermission = (role, permission, level) => {
    if (!editMode) return;

    setTempMatrix(prev => {
      const newMatrix = { ...prev };
      if (!newMatrix[role][permission]) {
        newMatrix[role][permission] = [];
      }

      const index = newMatrix[role][permission].indexOf(level);
      if (index > -1) {
        newMatrix[role][permission].splice(index, 1);
      } else {
        newMatrix[role][permission].push(level);
      }

      return newMatrix;
    });
  };

  const saveChanges = () => {
    // In real app, save to backend
    console.log('Saving permission matrix:', tempMatrix);
    setEditMode(false);
  };

  const discardChanges = () => {
    setTempMatrix(ROLE_PERMISSION_MATRIX);
    setEditMode(false);
  };

  const getPermissionStats = () => {
    const stats = {};
    Object.entries(ROLES).forEach(([roleKey, role]) => {
      const permissions = tempMatrix[roleKey] || {};
      let totalLevels = 0;
      let activeLevels = 0;

      Object.values(PERMISSIONS).forEach(perm => {
        totalLevels += perm.levels.length;
        activeLevels += permissions[perm.name]?.length || 0;
      });

      stats[roleKey] = {
        totalPermissions: Object.keys(permissions).length,
        totalLevels,
        activeLevels,
        percentage: Math.round((activeLevels / totalLevels) * 100)
      };
    });
    return stats;
  };

  const stats = getPermissionStats();

  // Group permissions by category
  const permissionsByCategory = Object.entries(PERMISSIONS).reduce((acc, [key, perm]) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push({ key, ...perm });
    return acc;
  }, {});

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Permission Matrix
        </Typography>

        <Stack direction="row" spacing={2}>
          <Stack direction="row" spacing={1}>
            <Button
              variant={viewMode === 'matrix' ? 'contained' : 'outlined'}
              startIcon={<GridIcon />}
              onClick={() => setViewMode('matrix')}
              size="small"
            >
              Matrix
            </Button>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ViewModuleIcon />}
              onClick={() => setViewMode('list')}
              size="small"
            >
              List
            </Button>
          </Stack>

          {!editMode ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
              disabled={selectedRole === 'ADMIN'} // Can't edit admin permissions
            >
              Edit Matrix
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={discardChanges}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveChanges}
              >
                Save Changes
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(ROLES).map(([roleKey, role]) => (
          <Grid item xs={12} sm={6} md={2.4} key={roleKey}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: selectedRole === roleKey ? `2px solid ${role.color}` : 'none',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={() => setSelectedRole(roleKey)}
            >
              <CardContent sx={{ textAlign: 'center', pb: '16px !important' }}>
                <Avatar sx={{ bgcolor: role.color, mx: 'auto', mb: 1 }}>
                  {role.icon}
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  {role.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {stats[roleKey]?.totalPermissions || 0} permissions
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      height: 4,
                      bgcolor: theme.palette.grey[200],
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${stats[roleKey]?.percentage || 0}%`,
                        bgcolor: role.color,
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stats[roleKey]?.percentage || 0}% access
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {editMode && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You're editing the permission matrix. Changes will affect all users with these roles.
        </Alert>
      )}

      {/* Permission Matrix View */}
      {viewMode === 'matrix' && (
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}>Permission</TableCell>
                {Object.entries(ROLES).map(([roleKey, role]) => (
                  <TableCell key={roleKey} align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: role.color }}>
                        {role.icon}
                      </Avatar>
                      {role.name}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <React.Fragment key={category}>
                  <TableRow>
                    <TableCell
                      colSpan={Object.keys(ROLES).length + 1}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                      onClick={() => toggleCategory(category)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {expandedCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        <Typography variant="subtitle2" fontWeight={600}>
                          {category}
                        </Typography>
                        <Badge badgeContent={perms.length} color="primary" />
                      </Box>
                    </TableCell>
                  </TableRow>
                  <Collapse in={expandedCategories[category]}>
                    {perms.map((perm) => (
                      <TableRow key={perm.key} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: 20 }}>{perm.icon}</Typography>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {perm.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {perm.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {Object.entries(ROLES).map(([roleKey, role]) => (
                          <TableCell key={roleKey} align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              {perm.levels.map(level => (
                                <Tooltip key={level} title={level}>
                                  <IconButton
                                    size="small"
                                    onClick={() => togglePermission(roleKey, perm.key, level)}
                                    disabled={!editMode || roleKey === 'ADMIN'}
                                    sx={{
                                      p: 0.5,
                                      bgcolor: hasPermission(roleKey, perm.key, level)
                                        ? alpha(getLevelColor(level), 0.1)
                                        : 'transparent',
                                      border: hasPermission(roleKey, perm.key, level)
                                        ? `1px solid ${getLevelColor(level)}`
                                        : '1px solid transparent',
                                      color: hasPermission(roleKey, perm.key, level)
                                        ? getLevelColor(level)
                                        : theme.palette.grey[400],
                                      '&:hover': {
                                        bgcolor: editMode && roleKey !== 'ADMIN'
                                          ? alpha(getLevelColor(level), 0.2)
                                          : 'transparent',
                                      }
                                    }}
                                  >
                                    {getPermissionIcon(level)}
                                  </IconButton>
                                </Tooltip>
                              ))}
                            </Stack>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </Collapse>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Grid container spacing={3}>
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <Grid item xs={12} md={6} lg={4} key={category}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {category}
                  </Typography>
                  <Stack spacing={2}>
                    {perms.map((perm) => (
                      <Box key={perm.key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontSize: 20 }}>{perm.icon}</Typography>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {perm.name}
                          </Typography>
                        </Box>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {perm.levels.map(level => {
                            const hasAccess = hasPermission(selectedRole, perm.key, level);
                            return (
                              <Chip
                                key={level}
                                label={level}
                                size="small"
                                icon={getPermissionIcon(level)}
                                color={hasAccess ? 'primary' : 'default'}
                                variant={hasAccess ? 'filled' : 'outlined'}
                                clickable={editMode && selectedRole !== 'ADMIN'}
                                onClick={() => togglePermission(selectedRole, perm.key, level)}
                                sx={{
                                  '& .MuiChip-icon': {
                                    fontSize: 14
                                  }
                                }}
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Permission Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPermission && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 24 }}>{selectedPermission.icon}</Typography>
                {selectedPermission.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedPermission.description}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                Access Levels:
              </Typography>
              <Stack spacing={1}>
                {selectedPermission.levels.map(level => (
                  <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPermissionIcon(level)}
                    <Typography variant="body2">{level}</Typography>
                  </Box>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PermissionMatrix;