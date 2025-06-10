import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { collaborationService, projectService } from "@/services/api";
import { DocumentAttachment, Project } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  Archive,
  Check,
  Download,
  Edit3,
  Eye,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  Grid,
  HardDrive,
  ImageIcon,
  Info,
  List,
  Loader2,
  MoreHorizontal,
  Paperclip,
  PlayCircle,
  RefreshCw,
  Search,
  Share2,
  SortAsc,
  Trash,
  Upload,
  User2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/zip', 'application/x-zip-compressed'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB


const DocumentSharing = () => {
  const { currentUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentAttachment | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [editingFileName, setEditingFileName] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch projects with error handling
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const response = await projectService.getAllProjects();
        return response.data.projects || [];
      } catch (error) {
        console.error("Error fetching projects:", error);
        throw new Error("Failed to load projects");
      }
    },
    retry: 2,
  });

  // Fetch documents with error handling
  const {
    data: documentsResponse,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ["documents", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return { documents: [] };
      try {
        const response = await collaborationService.getDocuments(selectedProject);
        // Handle both old and new response formats
        return response.data.documents ? response.data : { documents: response.data || [] };
      } catch (error) {
        console.error("Error fetching documents:", error);
        throw new Error("Failed to load documents");
      }
    },
    enabled: !!selectedProject,
    retry: 2,
  });

  const documents = documentsResponse?.documents || [];

  // Select first project by default
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  // File validation function
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not allowed`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9\.\-_]/g, '');
    if (sanitizedName !== file.name) {
      return 'Filename contains invalid characters';
    }

    if (file.name.trim() === '') {
      return 'Filename cannot be empty';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const errors: Record<string, string> = {};

      newFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors[file.name] = error;
        } else {
          validFiles.push(file);
        }
      });

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        // Show first error as toast
        const firstError = Object.values(errors)[0];
        toast.error(firstError);
      } else {
        setValidationErrors({});
      }

      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const removedFile = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));

    // Remove validation error for this file if it exists
    if (validationErrors[removedFile.name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[removedFile.name];
        return newErrors;
      });
    }
  };

  const handleUploadDocuments = async () => {
    if (files.length === 0 || !selectedProject || !currentUser) {
      toast.error("Please select files and ensure you're logged in");
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedProject)) {
      toast.error("Invalid project ID format");
      return;
    }

    setIsUploading(true);

    try {
      const initialProgress: Record<string, number> = {};
      files.forEach((file) => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);

      const uploadPromises = files.map(async (file) => {
        try {
          // Validate file again before upload
          const validationError = validateFile(file);
          if (validationError) {
            throw new Error(validationError);
          }

          setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }));

          // Create FormData - backend handles Cloudinary upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', selectedProject);
          formData.append('permissions', JSON.stringify([])); // Empty permissions for now

          setUploadProgress((prev) => ({ ...prev, [file.name]: 30 }));

          const response = await collaborationService.uploadDocument(formData);

          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

          return response;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 })); // -1 indicates error
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      // Check results
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`${successful} file(s) uploaded successfully! 🎉`);
        refetchDocuments();
      }

      if (failed > 0) {
        const failedFiles = results
          .filter((result, index) => result.status === 'rejected')
          .map((_, index) => files[index].name)
          .join(', ');
        toast.error(`Failed to upload: ${failedFiles}`);
      }

      if (successful === files.length) {
        setFiles([]);
        setUploadDialogOpen(false);
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      toast.error("Upload process failed. Please try again.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress({}), 2000); // Clear progress after 2 seconds
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!documentId || documentId.trim() === '') {
      toast.error("Invalid document ID");
      return;
    }

    try {
      await collaborationService.deleteDocument(documentId);
      toast.success("Document deleted successfully");
      refetchDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      const errorMessage = error?.response?.data?.error || "Failed to delete document";
      toast.error(errorMessage);
    }
  };

  const handleEditDocument = async () => {
    if (!selectedDocument || !editingFileName.trim()) {
      toast.error("Please enter a valid filename");
      return;
    }

    try {
      // This would require a new API endpoint for updating document metadata
      // await collaborationService.updateDocumentName(selectedDocument.id, editingFileName.trim());
      toast.info("Document name update feature coming soon");
      setEditDialogOpen(false);
      // refetchDocuments();
    } catch (error: any) {
      console.error("Error updating document:", error);
      const errorMessage = error?.response?.data?.error || "Failed to update document";
      toast.error(errorMessage);
    }
  };

  const handleDownloadDocument = (doc: DocumentAttachment) => {
    try {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const getFileIcon = (fileType: string, className: string = "h-6 w-6") => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className={`${className} text-green-500`} />;
    } else if (fileType.includes('pdf')) {
      return <FileText className={`${className} text-red-500`} />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <FileText className={`${className} text-blue-500`} />;
    } else if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) {
      return <FileSpreadsheet className={`${className} text-green-600`} />;
    } else if (fileType.includes('video') || fileType.includes('mp4')) {
      return <PlayCircle className={`${className} text-purple-500`} />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('gz')) {
      return <Archive className={`${className} text-orange-500`} />;
    }
    return <FileIcon className={`${className} text-gray-500`} />;
  };

  const getFilePreview = (doc: DocumentAttachment) => {
    if (doc.fileType.startsWith('image/')) {
      return (
        <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
          <img
            src={doc.url}
            alt={doc.fileName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div class="text-gray-400">Image not available</div>
                </div>
              `;
            }}
          />
        </div>
      );
    } else if (doc.fileType.includes('pdf')) {
      return (
        <div className="w-full h-32 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center">
          <FileText className="h-16 w-16 text-red-500" />
        </div>
      );
    } else if (doc.fileType.includes('video')) {
      return (
        <div className="w-full h-32 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center relative">
          <PlayCircle className="h-16 w-16 text-purple-500" />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Video
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-32 bg-gradient-to-br from-muted to-muted/70 rounded-lg flex items-center justify-center">
          {getFileIcon(doc.fileType, "h-16 w-16")}
        </div>
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDocumentDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      return formatDocumentDate(dateStr);
    } catch (e) {
      return dateStr;
    }
  };

  const canDeleteDocument = (doc: DocumentAttachment): boolean => {
    if (!currentUser) return false;
    return doc.uploadedBy === currentUser.id ||
      doc.permissions.some(p => p.userId === currentUser.id && p.access === 'delete');
  };

  const canEditDocument = (doc: DocumentAttachment): boolean => {
    if (!currentUser) return false;
    return doc.uploadedBy === currentUser.id ||
      doc.permissions.some(p => p.userId === currentUser.id && ['edit', 'delete'].includes(p.access));
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    ?.filter(doc => {
      const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || doc.fileType.includes(filterType);
      return matchesSearch && matchesFilter;
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.fileName.localeCompare(b.fileName);
        case "size":
          return b.fileSize - a.fileSize;
        case "type":
          return a.fileType.localeCompare(b.fileType);
        default: // date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    }) || [];

  const selectedProjectData = projects?.find(p => p.id === selectedProject);

  // Error Component
  const ErrorDisplay = ({ error, onRetry, title }: { error: any, onRetry: () => void, title: string }) => (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {error?.message || "Something went wrong. Please try again."}
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );

  // Loading Component
  const LoadingDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-card border shadow-xl rounded-xl">
            <LoadingDisplay message="Loading your projects..." />
          </Card>
        </div>
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-card border shadow-xl rounded-xl">
            <ErrorDisplay
              error={projectsError}
              onRetry={refetchProjects}
              title="Failed to Load Projects"
            />
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <div className="space-y-4">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden rounded-2xl border shadow-lg">
          <div className="relative p-2 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-timesRoman font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Document Hub
                    </h1>
                    <p className="text-muted-foreground text-sm lg:text-base">
                      Share, manage, and collaborate on team documents 📁
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
                <div className="w-full lg:w-80">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center">
                      <Archive className="h-4 w-4 mr-1" />
                      Project Workspace
                    </label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary hover:bg-background/90 transition-all">
                        <SelectValue placeholder="Select Project" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {projects?.map((project: Project) => (
                          <SelectItem key={project.id} value={project.id}>
                            📁 {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedProject && (
                  <Button
                    onClick={() => setUploadDialogOpen(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 h-10 mt-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                )}
              </div>
            </div>

            {/* Project Stats */}
            {selectedProjectData && (
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    <Archive className="h-3 w-3 mr-1" />
                    {selectedProjectData.status}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    <Paperclip className="h-4 w-4 mr-1" />
                    {documents?.length || 0} documents
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    <HardDrive className="h-4 w-4 mr-1" />
                    {documents?.reduce((total, doc) => total + doc.fileSize, 0)
                      ? formatFileSize(documents.reduce((total, doc) => total + doc.fileSize, 0))
                      : "0 B"} total
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedProject ? (
          <>
            {/* Controls Bar */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border shadow-lg p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  {/* Search */}
                  <div className="relative min-w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>

                  {/* Filter */}
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40 bg-background/50 border-border/50">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="pdf">PDFs</SelectItem>
                      <SelectItem value="word">Documents</SelectItem>
                      <SelectItem value="sheet">Spreadsheets</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 bg-background/50 border-border/50">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date Added</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="size">File Size</SelectItem>
                      <SelectItem value="type">File Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center space-x-2 bg-muted/30 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Documents Display */}
            <Card className="bg-card/80 backdrop-blur-sm border shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20 border-b border-border/20">
                <CardTitle className="text-xl font-timesRoman font-bold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                      <FolderOpen className="h-4 w-4 text-primary" />
                    </div>
                    <span>Team Documents</span>
                  </div>
                  {filteredAndSortedDocuments.length > 0 && (
                    <Badge variant="secondary" className="bg-background/50 border-primary/30 text-primary">
                      {filteredAndSortedDocuments.length} files
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                {documentsLoading ? (
                  <LoadingDisplay message="Loading documents..." />
                ) : documentsError ? (
                  <ErrorDisplay
                    error={documentsError}
                    onRetry={refetchDocuments}
                    title="Failed to Load Documents"
                  />
                ) : filteredAndSortedDocuments.length > 0 ? (
                  viewMode === 'grid' ? (
                    // Grid View
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredAndSortedDocuments.map((doc: DocumentAttachment) => (
                        <Card key={doc.id} className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 bg-background/50 backdrop-blur-sm">
                          <CardContent className="p-4 space-y-4">
                            {/* File Preview */}
                            <div className="relative">
                              {getFilePreview(doc)}
                              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
                                {getFileIcon(doc.fileType, "h-4 w-4")}
                              </div>
                            </div>

                            {/* File Info */}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {doc.fileName}
                              </h3>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>{formatRelativeTime(doc.createdAt)}</span>
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <User2 className="h-3 w-3 mr-1" />
                                <span className="truncate">{doc.user?.fullName || "Unknown"}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/20">
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.url, '_blank')}
                                  className="h-8 w-8 p-0 hover:bg-primary/10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setInfoDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-secondary/10"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setEditingFileName(doc.fileName);
                                      setEditDialogOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = doc.url;
                                      link.download = doc.fileName;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(doc.url);
                                      toast.success("Link copied to clipboard!");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // List View
                    <div className="space-y-2">
                      {filteredAndSortedDocuments.map((doc: DocumentAttachment) => (
                        <div key={doc.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/50">
                          <div className="flex-shrink-0">
                            {getFileIcon(doc.fileType, "h-8 w-8")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">{doc.fileName}</h3>
                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span>By {doc.user?.fullName || "Unknown"}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(doc.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setEditingFileName(doc.fileName);
                                    setEditDialogOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = doc.url;
                                    link.download = doc.fileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setInfoDialogOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Info className="h-4 w-4 mr-2" />
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Empty State
                  <div className="text-center py-16">
                    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-full flex items-center justify-center shadow-xl">
                      <FolderOpen className="h-16 w-16 text-primary" />
                    </div>
                    <div className="space-y-4 max-w-lg mx-auto">
                      <h3 className="text-2xl font-timesRoman font-bold text-foreground">
                        {searchTerm || filterType !== "all" ? "No Documents Found" : "Upload Your First Document"} 📁
                      </h3>
                      <p className="text-muted-foreground text-base leading-relaxed">
                        {searchTerm || filterType !== "all"
                          ? "Try adjusting your search or filter criteria to find what you're looking for."
                          : "Start collaborating by uploading documents, images, and files for your team to access."
                        }
                      </p>
                      {!searchTerm && filterType === "all" && (
                        <Button
                          onClick={() => setUploadDialogOpen(true)}
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          // No Project Selected State
          <Card className="bg-card/80 backdrop-blur-sm border shadow-lg rounded-2xl">
            <CardContent className="py-24 text-center">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
                <Archive className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-4 max-w-lg mx-auto">
                <h3 className="text-3xl font-timesRoman font-bold text-foreground">
                  Select Your Workspace 🚀
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Choose a project from the dropdown above to access and manage your team's documents and files.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-sm border shadow-lg">
          <DialogHeader className="space-y-4 pb-6 border-b border-border/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-timesRoman font-bold text-primary">
                  Upload Documents ⬆️
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Add files to your project workspace for team collaboration
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Drop Zone */}
            <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300">
              <input
                id="dropzone-file"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="dropzone-file"
                className="cursor-pointer flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground">
                    Drop files here or <span className="text-primary">click to browse</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Support for documents, images, videos, and archives
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 10MB per file
                  </p>
                </div>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Selected Files ({files.length})</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                    disabled={isUploading}
                  >
                    Clear All
                  </Button>
                </div>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/30">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getFileIcon(file.type, "h-6 w-6")}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate text-foreground">
                              {file.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type || "Unknown type"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {uploadProgress[file.name] !== undefined ? (
                            uploadProgress[file.name] === 100 ? (
                              <div className="flex items-center space-x-2 text-green-600">
                                <Check className="h-5 w-5" />
                                <span className="text-sm font-medium">Done</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground min-w-12">
                                  {uploadProgress[file.name]}%
                                </span>
                              </div>
                            )
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={isUploading}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-border/20">
            <div className="flex justify-between items-center w-full">
              <div className="text-xs text-muted-foreground">
                {files.length > 0 && `${files.length} file${files.length > 1 ? 's' : ''} selected`}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadDocuments}
                  disabled={files.length === 0 || isUploading}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm">
          <DialogHeader className="space-y-3 pb-6 border-b border-border/20">
            <DialogTitle className="text-xl font-timesRoman font-bold text-primary flex items-center">
              <Edit3 className="h-5 w-5 mr-2" />
              Rename Document
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="fileName" className="text-sm font-medium text-foreground">
                File Name
              </label>
              <Input
                id="fileName"
                value={editingFileName}
                onChange={(e) => setEditingFileName(e.target.value)}
                className="bg-background/80 border-border/50 focus:border-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditDocument}
              disabled={!editingFileName.trim() || editingFileName === selectedDocument?.fileName}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-sm">
          <DialogHeader className="space-y-3 border-b border-border/20">
            <DialogTitle className="text-xl font-timesRoman font-bold text-primary flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Document Details
            </DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-3">
              {/* Preview */}
              <div className="w-full h-max rounded-lg overflow-hidden border border-border/30">
                {getFilePreview(selectedDocument)}
              </div>
              {/* Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground">File Name</p>
                      <p className="font-medium text-foreground break-all">{selectedDocument.fileName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">File Size</p>
                      <p className="font-medium text-foreground">{formatFileSize(selectedDocument.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uploaded By</p>
                      <p className="font-medium text-foreground">{selectedDocument.user?.fullName || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground">File Type</p>
                      <p className="font-medium text-foreground">{selectedDocument.fileType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Upload Date</p>
                      <p className="font-medium text-foreground">{formatDocumentDate(selectedDocument.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Modified</p>
                      <p className="font-medium text-foreground">{formatRelativeTime(selectedDocument.updatedAt || selectedDocument.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedDocument.url, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedDocument.url;
                    link.download = selectedDocument.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentSharing;