import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Download,
  Print,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Fullscreen,
  FullscreenExit,
  GetApp,
  Share,
  Description,
  Image as ImageIcon,
  PictureAsPdf,
  InsertDriveFile,
  Person,
  CalendarToday,
  Folder,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  Close,
  NavigateBefore,
  NavigateNext,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

const ViewerContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '70vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.grey[900],
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden'
}));

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.grey[800],
  color: theme.palette.common.white,
  borderBottom: `1px solid ${theme.palette.grey[700]}`
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  padding: theme.spacing(2),
  position: 'relative'
}));

const DocumentImage = styled('img')(({ theme, zoom, rotation }) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  transform: `scale(${zoom}) rotate(${rotation}deg)`,
  transition: 'transform 0.3s ease',
  cursor: zoom > 1 ? 'move' : 'default'
}));

const PDFViewer = styled('iframe')(({ theme }) => ({
  width: '100%',
  height: '100%',
  border: 'none',
  borderRadius: theme.shape.borderRadius
}));

const VideoPlayer = styled('video')(({ theme }) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  borderRadius: theme.shape.borderRadius
}));

const AudioPlayer = styled('audio')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(2)
}));

const MetadataCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`document-tabpanel-${index}`}
    aria-labelledby={`document-tab-${index}`}
    {...other}
  >
    {value === index && <Box p={3}>{children}</Box>}
  </div>
);

const DocumentViewer = ({ document, onDownload, onPrint, onClose }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showMetadata, setShowMetadata] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);

  // Refs
  const contentRef = useRef(null);
  const imageRef = useRef(null);

  // Initialize document URL
  useEffect(() => {
    if (document?.url) {
      setDocumentUrl(document.url);
      setLoading(false);
    }
  }, [document]);

  // Handle document download
  const handleDownload = async () => {
    if (onDownload) {
      await onDownload();
    } else if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (documentUrl) {
      const printWindow = window.open(documentUrl);
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleZoomReset = () => {
    setZoom(1);
    setRotation(0);
  };

  // Rotation controls
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      contentRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Get file type icon
  const getFileIcon = (type) => {
    const iconProps = { fontSize: "large" };

    switch (type?.toLowerCase()) {
      case 'pdf':
        return <PictureAsPdf {...iconProps} color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <ImageIcon {...iconProps} color="primary" />;
      case 'doc':
      case 'docx':
      case 'txt':
        return <Description {...iconProps} color="blue" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <VideoPlayer {...iconProps} color="purple" />;
      case 'mp3':
      case 'wav':
        return <AudioPlayer {...iconProps} color="green" />;
      default:
        return <InsertDriveFile {...iconProps} color="grey" />;
    }
  };

  // Check if document is expired
  const isExpired = () => {
    return document?.expirationDate && new Date(document.expirationDate) < new Date();
  };

  // Render document content based on type
  const renderDocumentContent = () => {
    if (loading) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={48} />
          <Typography variant="body1">Loading document...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          <Typography variant="body1">Failed to load document</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      );
    }

    const fileExtension = document?.type?.toLowerCase() || document?.name?.split('.').pop()?.toLowerCase();

    // PDF files
    if (fileExtension === 'pdf') {
      return (
        <PDFViewer
          src={documentUrl}
          title="PDF Viewer"
        />
      );
    }

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) {
      return (
        <DocumentImage
          ref={imageRef}
          src={documentUrl}
          alt={document?.name || 'Document'}
          zoom={zoom}
          rotation={rotation}
          draggable={zoom > 1}
        />
      );
    }

    // Video files
    if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(fileExtension)) {
      return (
        <VideoPlayer
          src={documentUrl}
          controls
          autoPlay
        />
      );
    }

    // Audio files
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension)) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          {getFileIcon(fileExtension)}
          <Typography variant="h6">{document?.name || 'Audio Document'}</Typography>
          <AudioPlayer
            src={documentUrl}
            controls
          />
        </Box>
      );
    }

    // Text files
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(fileExtension)) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'background.paper',
            p: 2,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {/* Text content would be loaded here */}
          <Typography variant="body1">
            Text content preview not available. Please download to view.
          </Typography>
        </Box>
      );
    }

    // Unsupported file types
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        {getFileIcon(fileExtension)}
        <Typography variant="h6">{document?.name || 'Document'}</Typography>
        <Typography variant="body2" color="text.secondary">
          Preview not available for this file type
        </Typography>
        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={handleDownload}
        >
          Download to View
        </Button>
      </Box>
    );
  };

  return (
    <Box>
      {/* Toolbar */}
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" noWrap>
            {document?.name || 'Document Viewer'}
          </Typography>
          {document?.status && (
            <Chip
              label={document.status}
              size="small"
              color={document.status === 'approved' ? 'success' : 'default'}
              icon={document.status === 'approved' ? <CheckCircle /> : <Schedule />}
            />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Zoom controls for images */}
          {['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(document?.type?.toLowerCase()) && (
            <>
              <Tooltip title="Zoom Out">
                <IconButton onClick={handleZoomOut} size="small">
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </Typography>
              <Tooltip title="Zoom In">
                <IconButton onClick={handleZoomIn} size="small">
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Rotate Left">
                <IconButton onClick={handleRotateLeft} size="small">
                  <RotateLeft />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rotate Right">
                <IconButton onClick={handleRotateRight} size="small">
                  <RotateRight />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
            </>
          )}

          {/* Action buttons */}
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} size="small">
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} size="small">
              <Print />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton onClick={toggleFullscreen} size="small">
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Metadata">
            <IconButton onClick={() => setShowMetadata(!showMetadata)} size="small">
              {showMetadata ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title="Close">
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>

      {/* Main Content */}
      <Box display="flex" height="100%">
        {/* Document Viewer */}
        <Box flex={1}>
          <ViewerContainer ref={contentRef}>
            <ContentArea>
              <AnimatePresence mode="wait">
                <motion.div
                  key={document?.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {renderDocumentContent()}
                </motion.div>
              </AnimatePresence>
            </ContentArea>
          </ViewerContainer>
        </Box>

        {/* Metadata Sidebar */}
        {showMetadata && (
          <Box width={350} sx={{ borderLeft: 1, borderColor: 'divider' }}>
            <Paper elevation={0} square>
              <Box p={2} borderBottom={1} borderColor="divider">
                <Typography variant="h6">Document Details</Typography>
              </Box>

              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                variant="fullWidth"
              >
                <Tab label="Info" />
                <Tab label="Activity" />
                <Tab label="Security" />
              </Tabs>

              {/* Information Tab */}
              <TabPanel value={tabValue} index={0}>
                <List dense>
                  <ListItem>
                    <ListItemIcon><Description /></ListItemIcon>
                    <ListItemText
                      primary="Document Name"
                      secondary={document?.name || 'Untitled'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Folder /></ListItemIcon>
                    <ListItemText
                      primary="Category"
                      secondary={document?.category || 'Uncategorized'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><InsertDriveFile /></ListItemIcon>
                    <ListItemText
                      primary="File Type"
                      secondary={document?.type || 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Schedule /></ListItemIcon>
                    <ListItemText
                      primary="File Size"
                      secondary={document?.size ? `${(document.size / 1024).toFixed(2)} KB` : 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CalendarToday /></ListItemIcon>
                    <ListItemText
                      primary="Uploaded Date"
                      secondary={document?.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : 'Unknown'}
                    />
                  </ListItem>
                  {document?.expirationDate && (
                    <ListItem>
                      <ListItemIcon>
                        <Warning color={isExpired() ? "error" : "inherit"} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Expiration Date"
                        secondary={
                          <Typography color={isExpired() ? "error" : "inherit"}>
                            {new Date(document.expirationDate).toLocaleDateString()}
                            {isExpired() && ' (Expired)'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {document?.uploadedBy && (
                    <ListItem>
                      <ListItemIcon><Person /></ListItemIcon>
                      <ListItemText
                        primary="Uploaded By"
                        secondary={document.uploadedBy}
                      />
                    </ListItem>
                  )}
                </List>
              </TabPanel>

              {/* Activity Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="body2" color="text.secondary">
                  Document activity and version history will be displayed here.
                </Typography>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="body2" color="text.secondary">
                  Security information and access permissions will be displayed here.
                </Typography>
              </TabPanel>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DocumentViewer;