import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { projectService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Project, ProjectUpdate } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { uploadToCloudinary } from "@/lib/cloudinaryUtils";
import { FileText, Upload, X, Send, MessageCircle, Calendar, Paperclip, User } from "lucide-react";

// Types to match your backend DocumentAttachmentAttributes
interface DocumentPermission {
  userId: string;
  access: "view" | "edit" | "delete";
}

interface DocumentAttachmentForCreation {
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedBy: string;
  projectId?: string;
  permissions: DocumentPermission[];
}

const ProjectUpdates = () => {
  const { currentUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [updateContent, setUpdateContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const response = await projectService.getAllProjects();
        return response.data.projects || [];
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
        return [];
      }
    },
  });

  // Fetch project updates
  const { data: updates, refetch: refetchUpdates } = useQuery({
    queryKey: ["project-updates", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      try {
        const response = await projectService.getProjectUpdates(selectedProject);
        console.log("Project updates:", response.data);
        return response.data.updates || [];
      } catch (error) {
        console.error("Error fetching project updates:", error);
        toast.error("Failed to load project updates");
        return [];
      }
    },
    enabled: !!selectedProject,
  });

  // Select first project by default
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments([...attachments, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handlePostUpdate = async () => {
    if (!updateContent.trim() || !selectedProject) {
      toast.error("Please enter update content and select a project");
      return;
    }

    if (!currentUser?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload any attachments to Cloudinary first
      const uploadedAttachments: DocumentAttachmentForCreation[] = [];

      for (const file of attachments) {
        const url = await uploadToCloudinary(file);

        // Create attachment object matching DocumentAttachmentAttributes structure
        uploadedAttachments.push({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          url: url,
          uploadedBy: currentUser.id,
          projectId: selectedProject, // Optional but can be included
          permissions: [
            {
              userId: currentUser.id,
              access: "edit" as const // Creator gets edit access
            }
            // You can add more permissions here if needed
            // For example, give project members view access
          ]
        });
      }

      // Post the update with correct attachment structure
      await projectService.createProjectUpdate(selectedProject, {
        content: updateContent,
        attachments: uploadedAttachments,
      });

      toast.success("Update posted successfully");
      setUpdateContent("");
      setAttachments([]);
      refetchUpdates();
    } catch (error) {
      console.error("Error posting update:", error);
      toast.error("Failed to post update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProjectData = projects?.find(p => p.id === selectedProject);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="bg-card rounded-xl border shadow-lg p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-2 ">
              <div className="flex justify-between w-full">
                <h1 className="text-3xl lg:text-4xl font-timesRoman font-bold text-primary">
                  Project Updates
                </h1>
                {selectedProjectData && (
                  <div className="ml-4 flex items-center space-x-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {selectedProjectData.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Team Size:</span> {selectedProjectData.teamMembers?.length || 0} members
                    </div>
                    {selectedProjectData.dueDate && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {format(new Date(selectedProjectData.dueDate), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm lg:text-base">
                Share progress, announcements, and collaborate with your team
              </p>
            </div>

            <div className="w-full lg:w-80">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Active Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="bg-background">
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
          </div>
        </div>

        {/* Main Content Grid */}
        {selectedProject && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Side - Post Update */}
            <div className="lg:col-span-4">
              <Card className="bg-card border shadow-lg rounded-xl sticky top-6">
                <CardHeader className="bg-primary text-secondary-foreground rounded-t-xl">
                  <CardTitle className="text-lg text-white font-timesRoman font-bold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Post an Update
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-3 space-y-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {currentUser?.fullName || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>

                  {/* Text Area */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Share project updates, progress, milestones, or announcements with your team..."
                      className="min-h-32 bg-background resize-none"
                      value={updateContent}
                      onChange={(e) => setUpdateContent(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {updateContent.length} characters
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Attach Files
                    </Button>
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Attachments ({attachments.length})</span>
                        </div>
                        <ScrollArea className="max-h-32">
                          <div className="space-y-2">
                            {attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded-md border">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm truncate font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {Math.round(file.size / 1024)} KB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFile(index)}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-3 pt-0">
                  <Button
                    onClick={handlePostUpdate}
                    disabled={!updateContent.trim() || isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Update
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Side - Updates Feed */}
            <div className="lg:col-span-8">
              <Card className="bg-card border shadow-lg rounded-xl">
                <CardHeader className="bg-accent text-accent-foreground rounded-t-xl">
                  <CardTitle className="text-xl font-timesRoman font-bold flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Recent Updates
                    </div>
                    {updates && updates.length > 0 && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {updates.length} updates
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-300px)] min-h-[600px]">
                    <div className="p-6 space-y-4">
                      {updates && updates.length > 0 ? (
                        updates.map((update: ProjectUpdate, index) => (
                          <div key={update.id} className="relative">
                            {/* Timeline Line */}
                            {index < updates.length - 1 && (
                              <div className="absolute left-6 top-16 w-0.5 h-full bg-border"></div>
                            )}

                            <Card className="bg-background border-border hover:shadow-lg transition-all duration-200 relative z-10">
                              <CardHeader className="pb-3">
                                <div className="flex items-start space-x-3">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                                    {update.user?.fullName?.charAt(0) || "U"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium text-foreground">
                                        {update.user?.fullName || "Unknown User"}
                                      </p>
                                      <Badge variant="outline" className="text-sm">
                                        {format(new Date(update.createdAt), "MMM d, h:mm a")}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(update.createdAt), "EEEE, MMMM d, yyyy")}
                                    </p>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                <div className="whitespace-pre-wrap text-foreground bg-muted/20 p-4 rounded-lg border border-border/50">
                                  {update.content}
                                </div>

                                {/* Attachments */}
                                {update.attachments && update.attachments.length > 0 && (
                                  <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                                    <div className="flex items-center space-x-2 mb-3">
                                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-foreground">
                                        Attachments ({update.attachments.length})
                                      </span>
                                    </div>
                                    <div className="grid gap-2">
                                      {update.attachments.map((attachment, attachIndex) => (
                                        <a
                                          key={attachment.id || attachIndex}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 border border-border/50 transition-colors group"
                                        >
                                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                {attachment.fileName}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {Math.round(attachment.fileSize / 1024)} KB • {attachment.fileType}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                            Download →
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                            <MessageCircle className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-timesRoman font-bold text-foreground mb-2">
                            No updates yet
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4">
                            Be the first to share a project update!
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => document.querySelector('textarea')?.focus()}
                          >
                            Post First Update
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* No Project Selected State */}
        {!selectedProject && (
          <Card className="bg-card border shadow-lg rounded-xl">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-timesRoman font-bold text-foreground mb-2">
                Select a Project
              </h3>
              <p className="text-muted-foreground">
                Choose a project from the dropdown above to view and post updates
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectUpdates;