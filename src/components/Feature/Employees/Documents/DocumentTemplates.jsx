import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
  Badge,
  Avatar,
  InputAdornment,
  OutlinedInput,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Download,
  UploadFile,
  Assignment,
  FolderSpecial,
  Category,
  Description,
  PictureAsPdf,
  Image,
  InsertDriveFile,
  Business,
  People,
  Person,
  Star,
  StarBorder,
  MoreVert,
  Close,
  Save,
  Cancel,
  Visibility,
  CheckCircle,
  Warning,
  Info,
  FilterList,
  Sort,
  Refresh,
  CloudUpload,
  FileDownload,
  ContentCopy,
  Lock,
  LockOpen,
  Public,
  Private,
  Schedule,
  NewReleases,
  TrendingUp
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

const StyledCard = styled(Card)(({ theme, featured }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  ...(featured && {
    border: `2px solid ${theme.palette.primary.main}`,
    '&::before': {
      content: '"Featured"',
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      padding: '2px 8px',
      borderRadius: theme.shape.borderRadius,
      fontSize: '0.75rem',
      fontWeight: 'bold'
    }
  }),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const DepartmentChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  fontSize: '0.75rem'
}));

const TemplatesGrid = styled(Grid)(({ theme }) => ({
  '& .MuiGrid-item': {
    display: 'flex'
  }
}));

const DocumentTemplates = ({ userRole, onTemplateSelect, onTemplateAssign }) => {
  // State
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    departments: [],
    required: false,
    isActive: true,
    expirationRequired: false,
    expirationPeriod: 0,
    file: null,
    previewImage: null
  });

  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Categories
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'contract', label: 'Contracts' },
    { value: 'identification', label: 'Identification' },
    { value: 'tax', label: 'Tax Documents' },
    { value: 'benefits', label: 'Benefits' },
    { value: 'performance', label: 'Performance Review' },
    { value: 'training', label: 'Training' },
    { value: 'certification', label: 'Certifications' },
    { value: 'policy', label: 'Policy & Procedures' },
    { value: 'safety', label: 'Safety & Compliance' },
    { value: 'other', label: 'Other' }
  ];

  // Mock departments data
  useEffect(() => {
    setDepartments([
      { id: 'bakery', name: 'Bakery', activeEmployees: 12 },
      { id: 'sales', name: 'Sales', activeEmployees: 8 },
      { id: 'delivery', name: 'Delivery', activeEmployees: 6 },
      { id: 'admin', name: 'Administration', activeEmployees: 4 },
      { id: 'management', name: 'Management', activeEmployees: 3 }
    ]);

    // Mock templates data
    setTemplates([
      {
        id: '1',
        name: 'Employment Contract',
        description: 'Standard employment agreement for new hires',
        category: 'contract',
        departments: ['bakery', 'sales', 'delivery'],
        required: true,
        isActive: true,
        expirationRequired: true,
        expirationPeriod: 365,
        usageCount: 45,
        rating: 4.8,
        featured: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-03-10',
        type: 'pdf',
        size: 245680
      },
      {
        id: '2',
        name: 'Direct Deposit Form',
        description: 'Authorization form for direct deposit payments',
        category: 'onboarding',
        departments: ['bakery', 'sales', 'delivery', 'admin'],
        required: true,
        isActive: true,
        expirationRequired: false,
        usageCount: 62,
        rating: 4.5,
        featured: false,
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20',
        type: 'pdf',
        size: 128450
      },
      {
        id: '3',
        name: 'W-4 Tax Form',
        description: 'Federal tax withholding form',
        category: 'tax',
        departments: ['bakery', 'sales', 'delivery', 'admin'],
        required: true,
        isActive: true,
        expirationRequired: true,
        expirationPeriod: 365,
        usageCount: 33,
        rating: 4.9,
        featured: true,
        createdAt: '2024-01-10',
        updatedAt: '2024-01-10',
        type: 'pdf',
        size: 98760
      },
      {
        id: '4',
        name: 'Food Safety Certification',
        description: 'Food handler safety certification template',
        category: 'safety',
        departments: ['bakery'],
        required: true,
        isActive: true,
        expirationRequired: true,
        expirationPeriod: 180,
        usageCount: 18,
        rating: 4.7,
        featured: false,
        createdAt: '2024-02-01',
        updatedAt: '2024-02-01',
        type: 'pdf',
        size: 345200
      },
      {
        id: '5',
        name: 'Performance Review Template',
        description: 'Quarterly performance review form',
        category: 'performance',
        departments: ['bakery', 'sales', 'delivery'],
        required: false,
        isActive: true,
        expirationRequired: false,
        usageCount: 12,
        rating: 4.3,
        featured: false,
        createdAt: '2024-03-01',
        updatedAt: '2024-03-01',
        type: 'doc',
        size: 65400
      }
    ]);
    setLoading(false);
  }, []);

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = [...templates];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(template =>
        template.departments.includes(selectedDepartment)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usageCount':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'updatedAt':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchTerm, selectedCategory, selectedDepartment, sortBy]);

  // Pagination
  const paginatedTemplates = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedTemplates.slice(start, start + rowsPerPage);
  }, [filteredAndSortedTemplates, page, rowsPerPage]);

  // Handlers
  const handleCreateTemplate = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      departments: [],
      required: false,
      isActive: true,
      expirationRequired: false,
      expirationPeriod: 0,
      file: null,
      previewImage: null
    });
    setCreateDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      departments: template.departments,
      required: template.required,
      isActive: template.isActive,
      expirationRequired: template.expirationRequired,
      expirationPeriod: template.expirationPeriod,
      file: null,
      previewImage: null
    });
    setEditDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      // API call to save template
      console.log('Saving template:', formData);
      showNotification('Template saved successfully', 'success');
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      // Refresh templates list
    } catch (error) {
      showNotification('Failed to save template', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      // API call to delete template
      console.log('Deleting template:', templateId);
      showNotification('Template deleted successfully', 'success');
      // Refresh templates list
    } catch (error) {
      showNotification('Failed to delete template', 'error');
    }
  };

  const handleAssignTemplate = (template) => {
    setSelectedTemplate(template);
    setAssignDialogOpen(true);
  };

  const handleToggleRequired = async (templateId) => {
    try {
      // API call to toggle required status
      const updatedTemplates = templates.map(t =>
        t.id === templateId ? { ...t, required: !t.required } : t
      );
      setTemplates(updatedTemplates);
      showNotification('Template requirement updated', 'success');
    } catch (error) {
      showNotification('Failed to update template', 'error');
    }
  };

  const handleToggleActive = async (templateId) => {
    try {
      // API call to toggle active status
      const updatedTemplates = templates.map(t =>
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      );
      setTemplates(updatedTemplates);
      showNotification('Template status updated', 'success');
    } catch (error) {
      showNotification('Failed to update template', 'error');
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'contract': return <Assignment />;
      case 'identification': return <Person />;
      case 'tax': return <Description />;
      case 'benefits': return <Star />;
      case 'performance': return <TrendingUp />;
      case 'safety': return <Lock />;
      default: return <FolderSpecial />;
    }
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf': return <PictureAsPdf color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <Image color="primary" />;
      case 'doc':
      case 'docx': return <Description color="blue" />;
      default: return <InsertDriveFile color="grey" />;
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Document Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Manage and organize document templates for employee onboarding and compliance
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTemplate}
          size="large"
        >
          Create Template
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <FolderSpecial />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {templates.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Templates
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {templates.filter(t => t.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Templates
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Star />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {templates.filter(t => t.required).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Required Templates
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Uses
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Department"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="usageCount">Usage</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="updatedAt">Last Updated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box display="flex" gap={1}>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                fullWidth
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                fullWidth
              >
                Table
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Templates Grid */}
      {viewMode === 'grid' && (
        <TemplatesGrid container spacing={3}>
          {paginatedTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%' }}
              >
                <StyledCard featured={template.featured}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getCategoryIcon(template.category)}
                      </Avatar>
                      <Box>
                        <Chip
                          label={template.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={template.isActive ? 'success' : 'default'}
                        />
                        {template.required && (
                          <Chip
                            label="Required"
                            size="small"
                            color="warning"
                            sx={{ ml: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {template.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {template.description}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {getFileIcon(template.type)}
                      <Typography variant="caption">
                        {(template.size / 1024).toFixed(1)} KB
                      </Typography>
                      <Typography variant="caption">•</Typography>
                      <Typography variant="caption">
                        {template.usageCount} uses
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Departments:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {template.departments.map(deptId => {
                          const dept = departments.find(d => d.id === deptId);
                          return (
                            <DepartmentChip
                              key={deptId}
                              label={dept?.name || deptId}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    </Box>

                    {template.expirationRequired && (
                      <Alert severity="info" icon={<Schedule />}>
                        Expires after {template.expirationPeriod} days
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<UploadFile />}
                      onClick={() => onTemplateSelect?.(template)}
                    >
                      Use Template
                    </Button>
                    <IconButton size="small" onClick={() => handleEditTemplate(template)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleAssignTemplate(template)}>
                      <People />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)}>
                      <Delete />
                    </IconButton>
                  </CardActions>
                </StyledCard>
              </motion.div>
            </Grid>
          ))}
        </TemplatesGrid>
      )}

      {/* Templates Table */}
      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Template</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Departments</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTemplates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      {getFileIcon(template.type)}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(template.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={categories.find(c => c.value === template.category)?.label || template.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {template.departments.map(deptId => {
                        const dept = departments.find(d => d.id === deptId);
                        return (
                          <Chip
                            key={deptId}
                            label={dept?.name || deptId}
                            size="small"
                            variant="outlined"
                          />
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={template.isActive}
                            onChange={() => handleToggleActive(template.id)}
                            size="small"
                          />
                        }
                        label="Active"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={template.required}
                            onChange={() => handleToggleRequired(template.id)}
                            size="small"
                          />
                        }
                        label="Required"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {template.usageCount} uses
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Star color="warning" fontSize="small" />
                      <Typography variant="body2">
                        {template.rating}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditTemplate(template)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleAssignTemplate(template)}>
                      <People />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={Math.ceil(filteredAndSortedTemplates.length / rowsPerPage)}
              page={page + 1}
              onChange={(e, value) => setPage(value - 1)}
            />
          </Box>
        </TableContainer>
      )}

      {/* Empty State */}
      {!loading && paginatedTemplates.length === 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" py={8}>
          <FolderSpecial sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first template to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateTemplate}
          >
            Create Template
          </Button>
        </Box>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {createDialogOpen ? 'Create New Template' : 'Edit Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.filter(c => c.value !== 'all').map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Departments</InputLabel>
                <Select
                  multiple
                  value={formData.departments}
                  label="Departments"
                  onChange={(e) => setFormData(prev => ({ ...prev, departments: e.target.value }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={departments.find(d => d.id === value)?.name || value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.required}
                    onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                  />
                }
                label="Required Document"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active Template"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.expirationRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, expirationRequired: e.target.checked }))}
                  />
                }
                label="Has Expiration"
              />
            </Grid>
            {formData.expirationRequired && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expiration Period (days)"
                  value={formData.expirationPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, expirationPeriod: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUpload />}
              >
                Upload Template File
                <input
                  type="file"
                  hidden
                  onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files[0] }))}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Template Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Template to Departments</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select departments that should use this template:
          </Typography>
          <List>
            {departments.map((dept) => (
              <ListItem key={dept.id}>
                <ListItemText
                  primary={dept.name}
                  secondary={`${dept.activeEmployees} active employees`}
                />
                <ListItemSecondaryAction>
                  <Switch
                    defaultChecked={selectedTemplate?.departments.includes(dept.id)}
                    onChange={(e) => {
                      // Handle department assignment
                      console.log('Assign to', dept.id, e.target.checked);
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            setAssignDialogOpen(false);
            showNotification('Template assigned successfully', 'success');
          }} variant="contained">
            Assign Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotification(prev => ({ ...prev, open: false }))} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create template"
        onClick={handleCreateTemplate}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default DocumentTemplates;