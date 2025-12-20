import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  Divider,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  SwapHoriz as ChangeIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  Comment as CommentIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  History as HistoryIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  Kitchen as ChefIcon,
  DeliveryDining as DeliveryIcon,
  Person as EmployeeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ROLES = {
  ADMIN: { name: 'Admin', icon: AdminIcon, color: '#DC2626' },
  MANAGER: { name: 'Manager', icon: ManagerIcon, color: '#2563EB' },
  CHEF: { name: 'Chef', icon: ChefIcon, color: '#059669' },
  DELIVERY: { name: 'Delivery', icon: DeliveryIcon, color: '#7C3AED' },
  EMPLOYEE: { name: 'Employee', icon: EmployeeIcon, color: '#6B7280' },
};

// Mock data
const ROLE_HISTORY = [
  {
    id: 1,
    employeeId: 1,
    employeeName: 'Sarah Johnson',
    employeeEmail: 'sarah@butterbake.com',
    employeeAvatar: '/avatars/sarah.jpg',
    changeType: 'promotion',
    fromRole: 'EMPLOYEE',
    toRole: 'MANAGER',
    changedBy: 'John Smith',
    changedByEmail: 'john@butterbake.com',
    changedAt: '2024-12-14T10:30:00Z',
    reason: 'Promoted to Assistant Manager after 6 months of excellent performance',
    status: 'approved',
    approvedBy: 'CEO',
    approvedAt: '2024-12-14T14:00:00Z',
    effectiveDate: '2024-12-15',
    permissions: {
      gained: ['REPORTS', 'EMPLOYEES', 'SETTINGS'],
      lost: []
    }
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: 'Mike Chen',
    employeeEmail: 'mike@butterbake.com',
    employeeAvatar: '/avatars/mike.jpg',
    changeType: 'transfer',
    fromRole: 'DELIVERY',
    toRole: 'CHEF',
    changedBy: 'Sarah Johnson',
    changedByEmail: 'sarah@butterbake.com',
    changedAt: '2024-12-13T15:45:00Z',
    reason: 'Department transfer - requested move to kitchen for career growth',
    status: 'pending',
    requestedBy: 'Mike Chen',
    effectiveDate: '2024-12-20',
    permissions: {
      gained: ['KITCHEN', 'PRODUCTS'],
      lost: ['DELIVERY']
    }
  },
  {
    id: 3,
    employeeId: 3,
    employeeName: 'Emma Wilson',
    employeeEmail: 'emma@butterbake.com',
    employeeAvatar: '/avatars/emma.jpg',
    changeType: 'demotion',
    fromRole: 'MANAGER',
    toRole: 'EMPLOYEE',
    changedBy: 'HR Department',
    changedByEmail: 'hr@butterbake.com',
    changedAt: '2024-12-10T09:15:00Z',
    reason: 'Role adjustment due to restructuring',
    status: 'approved',
    approvedBy: 'HR Director',
    approvedAt: '2024-12-10T11:30:00Z',
    effectiveDate: '2024-12-01',
    permissions: {
      gained: [],
      lost: ['REPORTS', 'EMPLOYEES', 'FINANCIAL', 'SETTINGS']
    }
  },
  {
    id: 4,
    employeeId: 4,
    employeeName: 'James Taylor',
    employeeEmail: 'james@butterbake.com',
    employeeAvatar: '/avatars/james.jpg',
    changeType: 'new_hire',
    fromRole: null,
    toRole: 'DELIVERY',
    changedBy: 'HR Department',
    changedByEmail: 'hr@butterbake.com',
    changedAt: '2024-12-08T14:20:00Z',
    reason: 'New hire - Delivery driver',
    status: 'approved',
    approvedBy: 'Operations Manager',
    approvedAt: '2024-12-08T16:00:00Z',
    effectiveDate: '2024-12-09',
    permissions: {
      gained: ['DASHBOARD', 'ORDERS', 'DELIVERY', 'CUSTOMERS'],
      lost: []
    }
  },
  {
    id: 5,
    employeeId: 5,
    employeeName: 'Lisa Anderson',
    employeeEmail: 'lisa@butterbake.com',
    employeeAvatar: '/avatars/lisa.jpg',
    changeType: 'termination',
    fromRole: 'CHEF',
    toRole: null,
    changedBy: 'HR Department',
    changedByEmail: 'hr@butterbake.com',
    changedAt: '2024-12-05T16:30:00Z',
    reason: 'Employee resigned - voluntary termination',
    status: 'approved',
    approvedBy: 'Store Manager',
    approvedAt: '2024-12-05T17:00:00Z',
    effectiveDate: '2024-12-06',
    permissions: {
      gained: [],
      lost: ['DASHBOARD', 'ORDERS', 'KITCHEN', 'PRODUCTS', 'REPORTS', 'SCHEDULE']
    }
  },
  // Add more history entries...
];

const RoleHistory = () => {
  const theme = useTheme();
  const [history, setHistory] = useState(ROLE_HISTORY);
  const [filteredHistory, setFilteredHistory] = useState(ROLE_HISTORY);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Apply filters
  React.useEffect(() => {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole) {
      filtered = filtered.filter(item =>
        item.toRole === filterRole || item.fromRole === filterRole
      );
    }

    if (filterType) {
      filtered = filtered.filter(item => item.changeType === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (dateRange.start) {
      filtered = filtered.filter(item =>
        new Date(item.changedAt) >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      filtered = filtered.filter(item =>
        new Date(item.changedAt) <= new Date(dateRange.end + 'T23:59:59Z')
      );
    }

    setFilteredHistory(filtered);
  }, [history, searchTerm, filterRole, filterType, filterStatus, dateRange]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedHistory = filteredHistory.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const getChangeTypeIcon = (type) => {
    switch(type) {
      case 'promotion': return <UpIcon color="success" />;
      case 'demotion': return <DownIcon color="error" />;
      case 'transfer': return <ChangeIcon color="info" />;
      case 'new_hire': return <PersonIcon color="primary" />;
      case 'termination': return <CancelIcon color="error" />;
      default: return <ChangeIcon />;
    }
  };

  const getChangeTypeLabel = (type) => {
    const labels = {
      promotion: 'Promotion',
      demotion: 'Demotion',
      transfer: 'Transfer',
      new_hire: 'New Hire',
      termination: 'Termination'
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <ApprovedIcon color="success" />;
      case 'pending': return <PendingIcon color="warning" />;
      case 'rejected': return <RejectedIcon color="error" />;
      default: return null;
    }
  };

  const exportHistory = () => {
    // In real app, implement CSV export
    console.log('Exporting role history...');
  };

  const getStats = () => {
    const total = history.length;
    const approved = history.filter(h => h.status === 'approved').length;
    const pending = history.filter(h => h.status === 'pending').length;
    const rejected = history.filter(h => h.status === 'rejected').length;
    const thisMonth = history.filter(h => {
      const changeDate = new Date(h.changedAt);
      const now = new Date();
      return changeDate.getMonth() === now.getMonth() &&
             changeDate.getFullYear() === now.getFullYear();
    }).length;

    return { total, approved, pending, rejected, thisMonth };
  };

  const stats = getStats();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Role Change History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportHistory}
        >
          Export
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <HistoryIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Changes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <ApprovedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                  <RejectedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <TimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.thisMonth}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search employee or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Role"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <MenuItem key={key} value={key}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Change Type</InputLabel>
                <Select
                  value={filterType}
                  label="Change Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="promotion">Promotion</MenuItem>
                  <MenuItem value="demotion">Demotion</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                  <MenuItem value="new_hire">New Hire</MenuItem>
                  <MenuItem value="termination">Termination</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* History Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Change Type</TableCell>
              <TableCell>Role Change</TableCell>
              <TableCell>Changed By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedHistory.map((change) => (
              <motion.tr
                key={change.id}
                component={TableRow}
                hover
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={change.employeeAvatar} alt={change.employeeName}>
                      {change.employeeName.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {change.employeeName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {change.employeeEmail}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getChangeTypeIcon(change.changeType)}
                    <Typography variant="body2">
                      {getChangeTypeLabel(change.changeType)}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {change.fromRole && (
                      <>
                        <Chip
                          icon={<ROLES[change.fromRole]?.icon sx={{ fontSize: 16 }} />}
                          label={ROLES[change.fromRole]?.name}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: ROLES[change.fromRole]?.color }}
                        />
                        <ChangeIcon sx={{ fontSize: 16 }} />
                      </>
                    )}
                    {change.toRole && (
                      <Chip
                        icon={<ROLES[change.toRole]?.icon sx={{ fontSize: 16 }} />}
                        label={ROLES[change.toRole]?.name}
                        size="small"
                        sx={{
                          bgcolor: ROLES[change.toRole]?.color,
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    )}
                    {!change.toRole && (
                      <Chip
                        label="Terminated"
                        size="small"
                        color="error"
                      />
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {change.changedBy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {change.changedByEmail}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(change.changedAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(change.changedAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(change.status)}
                    <Typography
                      variant="body2"
                      sx={{
                        textTransform: 'capitalize',
                        color: change.status === 'approved' ? theme.palette.success.main :
                               change.status === 'pending' ? theme.palette.warning.main :
                               theme.palette.error.main
                      }}
                    >
                      {change.status}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedChange(change);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Pagination
          count={Math.ceil(filteredHistory.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
        />
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedChange && (
          <>
            <DialogTitle>
              Role Change Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Employee Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={selectedChange.employeeAvatar}
                      alt={selectedChange.employeeName}
                      sx={{ width: 48, height: 48 }}
                    >
                      {selectedChange.employeeName.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedChange.employeeName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedChange.employeeEmail}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Role Change
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {selectedChange.fromRole && (
                      <>
                        <Chip
                          icon={<ROLES[selectedChange.fromRole]?.icon sx={{ fontSize: 16 }} />}
                          label={ROLES[selectedChange.fromRole]?.name}
                          size="small"
                          variant="outlined"
                        />
                        <ChangeIcon />
                      </>
                    )}
                    {selectedChange.toRole && (
                      <Chip
                        icon={<ROLES[selectedChange.toRole]?.icon sx={{ fontSize: 16 }} />}
                        label={ROLES[selectedChange.toRole]?.name}
                        size="small"
                        sx={{
                          bgcolor: ROLES[selectedChange.toRole]?.color,
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getChangeTypeLabel(selectedChange.changeType)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Change Details
                  </Typography>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Changed By
                      </Typography>
                      <Typography variant="body2">
                        {selectedChange.changedBy} ({selectedChange.changedByEmail})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Change Date
                      </Typography>
                      <Typography variant="body2">
                        {new Date(selectedChange.changedAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Effective Date
                      </Typography>
                      <Typography variant="body2">
                        {selectedChange.effectiveDate}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(selectedChange.status)}
                        <Typography
                          variant="body2"
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {selectedChange.status}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Reason
                  </Typography>
                  <Typography variant="body2">
                    {selectedChange.reason}
                  </Typography>
                </Grid>

                {(selectedChange.permissions.gained.length > 0 || selectedChange.permissions.lost.length > 0) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Permission Changes
                    </Typography>
                    {selectedChange.permissions.gained.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="success.main" gutterBottom>
                          Permissions Gained:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedChange.permissions.gained.map(perm => (
                            <Chip
                              key={perm}
                              label={perm}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {selectedChange.permissions.lost.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="error.main" gutterBottom>
                          Permissions Lost:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedChange.permissions.lost.map(perm => (
                            <Chip
                              key={perm}
                              label={perm}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RoleHistory;