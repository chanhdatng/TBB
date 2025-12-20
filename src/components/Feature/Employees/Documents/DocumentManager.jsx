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
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
  Badge,
  Avatar,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Delete,
  Visibility,
  GetApp,
  Print,
  CloudUpload,
  Folder,
  Description,
  PictureAsPdf,
  Image,
  InsertDriveFile,
  MoreVert,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  Warning,
  CalendarToday,
  Person,
  Category,
  Refresh,
  SelectAll,
  ClearAll,
  Archive,
  Unarchive,
  AssignmentTurnedIn,
  Schedule,
  Close,
  ExpandMore,
  ChevronRight
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentViewer from './DocumentViewer';
import documentService from '../../../services/documentService';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8]
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  '&.approved': {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.dark
  },
  '&.pending': {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    color: theme.palette.warning.dark
  },
  '&.expired': {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.dark
  },
  '&.draft': {
    backgroundColor: alpha(theme.palette.grey.main, 0.1),
    color: theme.palette.grey.dark
  }
}));

const FileIcon = ({ type, size = 40 }) => {
  const iconProps = { style: { fontSize: size } };

  switch (type?.toLowerCase()) {
    case 'pdf':
      return <PictureAsPdf {...iconProps} color="error" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <Image {...iconProps} color="primary" />;
    case 'doc':
    case 'docx':
    case 'txt':
      return <Description {...iconProps} color="blue" />;
    default:
      return <InsertDriveFile {...iconProps} color="grey" />;
  }
};

const DocumentManager = ({ employeeId, department, role, onDocumentSelect }) => {
  // State management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Dialog states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [bulkActionMenu, setBulkActionMenu] = useState(null);
  const [documentMenu, setDocumentMenu] = useState(null);
  const [menuDocument, setMenuDocument] = useState(null);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Document categories
  const categories = [
    { value: 'all', label: 'All Documents' },
    { value: 'contract', label: 'Contracts' },
    { value: 'id', label: 'Identification' },
    { value: 'tax', label: 'Tax Documents' },
    { value: 'benefits', label: 'Benefits' },
    { value: 'performance', label: 'Performance' },
    { value: 'training', label: 'Training' },
    { value: 'certification', label: 'Certifications' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, [employeeId, department]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocuments({
        employeeId,
        department,
        includeExpired: true
      });
      setDocuments(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch documents');
      showNotification(err.message || 'Failed to fetch documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploadedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';

      if (sortBy === 'updatedAt' || sortBy === 'uploadedAt' || sortBy === 'expirationDate') {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [documents, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  // Pagination
  const paginatedDocuments = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedDocuments.slice(start, start + rowsPerPage);
  }, [filteredAndSortedDocuments, page, rowsPerPage]);

  // Selection handlers
  const handleSelectDocument = (documentId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === paginatedDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(paginatedDocuments.map(doc => doc.id));
    }
  };

  // Document actions
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
    setDocumentMenu(null);
  };

  const handleDownloadDocument = async (document) => {
    try {
      await documentService.downloadDocument(document.id);
      showNotification(`Downloaded ${document.name}`, 'success');
    } catch (err) {
      showNotification('Failed to download document', 'error');
    }
    setDocumentMenu(null);
  };

  const handleDeleteDocument = async (documentIds) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await documentService.deleteDocuments(Array.isArray(documentIds) ? documentIds : [documentIds]);
      showNotification('Document deleted successfully', 'success');
      fetchDocuments();
      setSelectedDocuments([]);
      setBulkActionMenu(null);
      setDocumentMenu(null);
    } catch (err) {
      showNotification('Failed to delete document', 'error');
    }
  };

  const handleBulkApprove = async () => {
    try {
      await documentService.bulkUpdateStatus(selectedDocuments, 'approved');
      showNotification('Documents approved successfully', 'success');
      fetchDocuments();
      setSelectedDocuments([]);
      setBulkActionMenu(null);
    } catch (err) {
      showNotification('Failed to approve documents', 'error');
    }
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'approved';
      case 'pending': return 'pending';
      case 'expired': return 'expired';
      case 'draft': return 'draft';
      default: return 'draft';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <Pending />;
      case 'expired': return <Warning />;
      case 'draft': return <Schedule />;
      default: return <ErrorIcon />;
    }
  };

  const isDocumentExpired = (expirationDate) => {
    return expirationDate && new Date(expirationDate) < new Date();
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Render loading state
  if (loading && documents.length === 0) {
    return (
      <Backdrop open={true}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={48} />
          <Typography variant="h6">Loading documents...</Typography>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Document Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => window.location.href = '/employees/upload'}
        >
          Upload Document
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <IconButton size="small" onClick={fetchDocuments}>
            <Refresh />
          </IconButton>
        }>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Description />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {documents.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Documents
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
                  {documents.filter(d => d.status === 'approved').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Pending />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {documents.filter(d => d.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <Warning />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {documents.filter(d => isDocumentExpired(d.expirationDate)).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expired
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
              placeholder="Search documents..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
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
                <MenuItem value="updatedAt">Last Modified</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="uploadedAt">Upload Date</MenuItem>
                <MenuItem value="expirationDate">Expiration</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box display="flex" gap={1}>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                sx={{ minWidth: 'auto' }}
              >
                <FilterList />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                sx={{ minWidth: 'auto' }}
              >
                <CalendarToday />
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedDocuments.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    startIcon={<AssignmentTurnedIn />}
                    onClick={handleBulkApprove}
                    variant="outlined"
                    size="small"
                  >
                    Approve
                  </Button>
                  <Button
                    startIcon={<Download />}
                    onClick={() => {
                      selectedDocuments.forEach(id => {
                        const doc = documents.find(d => d.id === id);
                        if (doc) handleDownloadDocument(doc);
                      });
                    }}
                    variant="outlined"
                    size="small"
                  >
                    Download
                  </Button>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => handleDeleteDocument(selectedDocuments)}
                    color="error"
                    variant="outlined"
                    size="small"
                  >
                    Delete
                  </Button>
                  <IconButton onClick={() => setSelectedDocuments([])}>
                    <ClearAll />
                  </IconButton>
                </Box>
              </Box>
            </motion.div>
          </Paper>
        )}
      </AnimatePresence>

      {/* Documents Grid View */}
      {viewMode === 'grid' && (
        <Grid container spacing={3}>
          {paginatedDocuments.map((document) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={document.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <StyledCard>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <FileIcon type={document.type} />
                      <Checkbox
                        checked={selectedDocuments.includes(document.id)}
                        onChange={() => handleSelectDocument(document.id)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="subtitle2" noWrap fontWeight="bold" mb={1}>
                      {document.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" noWrap mb={2}>
                      {document.description || 'No description'}
                    </Typography>

                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                      <StatusChip
                        label={document.status}
                        status={getStatusColor(document.status)}
                        size="small"
                        icon={getStatusIcon(document.status)}
                      />
                      {document.expirationDate && (
                        <Chip
                          label={isDocumentExpired(document.expirationDate) ? 'Expired' : 'Valid'}
                          size="small"
                          color={isDocumentExpired(document.expirationDate) ? 'error' : 'success'}
                        />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Category: {document.category || 'Uncategorized'}
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadDocument(document)}
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuDocument(document);
                        setDocumentMenu(e.currentTarget);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </CardActions>
                </StyledCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Documents Table View */}
      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedDocuments.length === paginatedDocuments.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDocuments.map((document) => (
                <TableRow key={document.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedDocuments.includes(document.id)}
                      onChange={() => handleSelectDocument(document.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <FileIcon type={document.type} size={24} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {document.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(document.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {document.category || 'Uncategorized'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={document.status}
                      status={getStatusColor(document.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={
                      isDocumentExpired(document.expirationDate) ? 'error' : 'inherit'
                    }>
                      {document.expirationDate
                        ? new Date(document.expirationDate).toLocaleDateString()
                        : 'Never'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadDocument(document)}
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuDocument(document);
                        setDocumentMenu(e.currentTarget);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[6, 12, 24, 48]}
            component="div"
            count={filteredAndSortedDocuments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedDocuments.length === 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" py={8}>
          <Folder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No documents found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Try adjusting your filters or upload a new document
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => window.location.href = '/employees/upload'}
          >
            Upload First Document
          </Button>
        </Box>
      )}

      {/* Document Menu */}
      <Menu
        anchorEl={documentMenu}
        open={Boolean(documentMenu)}
        onClose={() => setDocumentMenu(null)}
      >
        <MenuItem onClick={() => handleViewDocument(menuDocument)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          View
        </MenuItem>
        <MenuItem onClick={() => handleDownloadDocument(menuDocument)}>
          <ListItemIcon><Download /></ListItemIcon>
          Download
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Print /></ListItemIcon>
          Print
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDeleteDocument(menuDocument?.id)}>
          <ListItemIcon><Delete /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Document Viewer Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Document Viewer
          <IconButton
            onClick={() => setViewerOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <DocumentViewer
              document={selectedDocument}
              onDownload={() => handleDownloadDocument(selectedDocument)}
              onPrint={() => window.print()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentManager;