import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collaborationService, projectService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Project, DiscussionThread, ThreadComment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  Calendar,
  Search,
  MessageCircle,
  Coffee,
  Lightbulb,
  Loader2,
  AlertCircle,
  RefreshCw,
  Smile,
  Hash,
  Clock,
  User2,
  Zap
} from "lucide-react";

const DiscussionThreads = () => {
  const { currentUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);

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

  // Fetch threads with error handling
  const {
    data: threads,
    isLoading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads
  } = useQuery({
    queryKey: ["discussion-threads", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      try {
        const response = await collaborationService.getThreads(selectedProject);
        return response.data || [];
      } catch (error) {
        console.error("Error fetching threads:", error);
        throw new Error("Failed to load discussion threads");
      }
    },
    enabled: !!selectedProject,
    retry: 2,
  });

  // Fetch comments with error handling
  const {
    data: comments,
    isLoading: commentsLoading,
    error: commentsError,
    refetch: refetchComments
  } = useQuery({
    queryKey: ["thread-comments", selectedThread],
    queryFn: async () => {
      if (!selectedThread) return [];
      try {
        const response = await collaborationService.getComments(selectedThread);
        return response.data || [];
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw new Error("Failed to load comments");
      }
    },
    enabled: !!selectedThread,
    retry: 2,
  });

  // Select first project by default
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  const handleCreateThread = async () => {
    if (!threadTitle.trim() || !threadContent.trim() || !selectedProject || !currentUser) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmittingThread(true);
    try {
      await collaborationService.createThread({
        projectId: selectedProject,
        title: threadTitle,
        content: threadContent,
      });

      toast.success("Discussion thread created successfully! 🎉");
      setNewThreadDialogOpen(false);
      setThreadTitle("");
      setThreadContent("");
      await refetchThreads();
    } catch (error) {
      console.error("Error creating thread:", error);
      toast.error("Failed to create discussion thread. Please try again.");
    } finally {
      setIsSubmittingThread(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim() || !selectedThread || !currentUser) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmittingComment(true);
    try {
      await collaborationService.addComment(selectedThread, {
        content: commentContent,
      });

      toast.success("Comment added! 💬");
      setCommentContent("");
      await Promise.all([refetchComments(), refetchThreads()]);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return format(date, "MMM d");
  };

  const selectedProjectData = projects?.find(p => p.id === selectedProject);
  const selectedThreadData = threads?.find(t => t.id === selectedThread);

  const filteredThreads = threads?.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Error Component
  const ErrorDisplay = ({ error, onRetry, title }: { error: any, onRetry: () => void, title: string }) => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">
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
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
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
        <div className="relative overflow-hidden rounded-2xl border shadow-lg">
          <div className="relative p-3 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-timesRoman font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Team Discussions
                    </h1>
                    <p className="text-muted-foreground text-sm lg:text-base">
                      Collaborate, brainstorm, and drive innovation together 🚀
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
                <div className="w-full lg:w-80">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center">
                      <Hash className="h-4 w-4 mr-1" />
                      Active Project
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
                    onClick={() => setNewThreadDialogOpen(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 h-10 mt-auto"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                )}
              </div>
            </div>

            {/* Enhanced Project Info Bar */}
            {selectedProjectData && (
              <div className="mt-6  border-t border-border/20">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    <Zap className="h-3 w-3 mr-1" />
                    {selectedProjectData.status}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    <Users className="h-4 w-4 mr-1" />
                    {selectedProjectData.teamMembers?.length || 0} team members
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {threads?.length || 0} active discussions
                  </div>
                  {selectedProjectData.dueDate && (
                    <div className="flex items-center text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due {format(new Date(selectedProjectData.dueDate), "MMM d")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedProject ? (
          <div className="grid lg:grid-cols-12 gap-6 ">
            {/* Left Side - Chat Content */}
            <div className="lg:col-span-8">
              <Card className="bg-card/80 backdrop-blur-sm border shadow-lg rounded-2xl h-full flex flex-col overflow-hidden">
                {selectedThread ? (
                  <>
                    {/* Stunning Chat Header */}
                    <CardHeader className="bg-gradient-to-r from-secondary/20 to-accent/20 border-b border-border/20 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-timesRoman font-bold text-foreground">
                                {selectedThreadData?.title}
                              </CardTitle>
                              <div className="flex mt-1 items-center space-x-2 text-sm text-muted-foreground">
                                <User2 className="h-3 w-3" />
                                <span>Started by {selectedThreadData?.user?.fullName}</span>
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(selectedThreadData?.createdAt || "")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-background/50 border-primary/30 text-primary">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {comments?.length || 0} messages
                        </Badge>
                      </div>
                    </CardHeader>

                    {/* Chat Messages with ScrollArea */}
                    <CardContent className="flex-1 p-0 overflow-hidden">
                      {commentsLoading ? (
                        <LoadingDisplay message="Loading conversation..." />
                      ) : commentsError ? (
                        <ErrorDisplay
                          error={commentsError}
                          onRetry={refetchComments}
                          title="Failed to Load Messages"
                        />
                      ) : (
                        <ScrollArea className="h-full">
                          <div className="p-2 space-y-6">
                            {/* Comments */}
                            {comments && comments.length > 0 ? (
                              <div className="space-y-4">
                                {comments.map((comment: ThreadComment, index) => (
                                  <div key={comment.id} className="flex gap-4 group hover:bg-muted/20 p-4 rounded-xl transition-all duration-200">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-secondary/30 flex items-center justify-center text-accent-foreground font-bold text-sm flex-shrink-0 shadow-md">
                                      {comment.user?.fullName?.charAt(0) || "U"}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <p className="font-medium text-foreground text-sm">
                                            {comment.user?.fullName || "Unknown User"}
                                          </p>
                                          {comment.user?.id === currentUser?.id && (
                                            <Badge variant="outline" className="text-xs">You</Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {formatRelativeTime(comment.createdAt)}
                                        </p>
                                      </div>
                                      <div className="text-sm text-foreground whitespace-pre-wrap bg-background/80 p-3 rounded-xl border border-border/30 shadow-sm">
                                        {comment.content}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                                  <MessageCircle className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                  Be the first to respond! 💭
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  Share your thoughts and start the conversation
                                </p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>

                    {/* Enhanced Chat Input */}
                    <CardFooter className="border-t border-border/20 bg-gradient-to-r from-muted/30 to-background/30 backdrop-blur-sm p-6">
                      <div className="flex w-full space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 shadow-md">
                          {currentUser?.fullName?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 flex space-x-3">
                          <div className="flex-1 relative">
                            <Textarea
                              placeholder="Share your thoughts... ✨"
                              value={commentContent}
                              onChange={(e) => setCommentContent(e.target.value)}
                              className="min-h-[50px] max-h-[120px] bg-background/80 border-border/50 focus:border-primary transition-all duration-200 resize-none shadow-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (commentContent.trim() && !isSubmittingComment) {
                                    handleAddComment();
                                  }
                                }
                              }}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                              {commentContent.length}/1000
                            </div>
                          </div>
                          <Button
                            onClick={handleAddComment}
                            disabled={!commentContent.trim() || isSubmittingComment}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6"
                          >
                            {isSubmittingComment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </>
                ) : (
                  <CardContent className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center space-y-6 max-w-md">
                      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
                        <MessageSquare className="h-16 w-16 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-timesRoman font-bold text-foreground">
                          Choose a Discussion 💬
                        </h3>
                        <p className="text-muted-foreground text-base leading-relaxed">
                          Select a discussion thread from the sidebar to join the conversation and collaborate with your team.
                        </p>
                      </div>
                      {threads && threads.length === 0 && (
                        <Button
                          onClick={() => setNewThreadDialogOpen(true)}
                          variant="outline"
                          className="mt-6 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/30"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Start First Discussion
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Right Side - Enhanced Threads List */}
            <div className="lg:col-span-4">
              <Card className="bg-card/80 backdrop-blur-sm border shadow-lg rounded-2xl h-full flex flex-col overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20 border-b border-border/20">
                  <div className="space-y-4">
                    <CardTitle className="text-xl font-timesRoman font-bold flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <span>Discussions</span>
                      </div>
                      {threads && threads.length > 0 && (
                        <Badge variant="secondary" className="bg-background/50 border-primary/30 text-primary">
                          {threads.length}
                        </Badge>
                      )}
                    </CardTitle>

                    {/* Enhanced Search Bar */}
                    {threads && threads.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search discussions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden">
                  {threadsLoading ? (
                    <LoadingDisplay message="Loading discussions..." />
                  ) : threadsError ? (
                    <ErrorDisplay
                      error={threadsError}
                      onRetry={refetchThreads}
                      title="Failed to Load Discussions"
                    />
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-3">
                        {filteredThreads.length > 0 ? (
                          filteredThreads.map((thread: DiscussionThread) => (
                            <div
                              key={thread.id}
                              className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border ${selectedThread === thread.id
                                ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 shadow-lg'
                                : 'hover:bg-muted/30 border-transparent hover:border-border/50 hover:shadow-md'
                                }`}
                              onClick={() => setSelectedThread(thread.id)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-semibold text-foreground text-sm leading-5 line-clamp-2 group-hover:text-primary transition-colors">
                                    {thread.title}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={`ml-2 text-xs flex-shrink-0 ${selectedThread === thread.id ? 'border-primary/50 text-primary' : ''
                                      }`}
                                  >
                                    {thread.commentCount || 0}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-accent/40 to-secondary/40 flex items-center justify-center text-[10px] font-medium">
                                      {thread.user?.fullName?.charAt(0) || "U"}
                                    </div>
                                    <span className="truncate max-w-24 font-medium">
                                      {thread.user?.fullName || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatRelativeTime(thread.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : threads && threads.length > 0 && searchTerm ? (
                          // No Search Results - Enhanced
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-muted/50 to-background rounded-full flex items-center justify-center">
                              <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">No Results Found</h3>
                            <p className="text-sm text-muted-foreground">
                              No discussions match "{searchTerm}"
                            </p>
                          </div>
                        ) : (
                          // No Threads State - Enhanced
                          <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-full flex items-center justify-center shadow-xl">
                              <Coffee className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-timesRoman font-bold text-foreground mb-3">
                              Start the Conversation! 🎯
                            </h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-56 mx-auto leading-relaxed">
                              No discussions yet. Be the pioneer and create the first discussion thread for this project.
                            </p>
                            <Button
                              onClick={() => setNewThreadDialogOpen(true)}
                              size="sm"
                              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Create Discussion
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // No Project Selected State - Enhanced
          <Card className="bg-card/80 backdrop-blur-sm border shadow-lg rounded-2xl">
            <CardContent className="py-24 text-center">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-4 max-w-lg mx-auto">
                <h3 className="text-3xl font-timesRoman font-bold text-foreground">
                  Choose Your Project 🚀
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Select a project from the dropdown above to access team discussions and start collaborating with your amazing colleagues.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mt-6">
                  <Smile className="h-4 w-4" />
                  <span>Ready to brainstorm some great ideas?</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={newThreadDialogOpen} onOpenChange={setNewThreadDialogOpen}>
        <DialogContent className="sm:max-w-3xl bg-card/95 backdrop-blur-sm border shadow-lg">
          <DialogHeader className="space-y-4 pb-6 border-b border-border/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-timesRoman font-bold text-primary">
                  Start New Discussion ✨
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Create an engaging discussion thread to collaborate with your team
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label htmlFor="title" className="text-sm font-semibold text-foreground flex items-center">
                <Hash className="h-4 w-4 mr-1" />
                Discussion Title *
              </label>
              <Input
                id="title"
                placeholder="What's on your mind? Make it catchy! 🎯"
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                className="bg-background/80 border-border/50 focus:border-primary transition-all duration-200 text-base"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="content" className="text-sm font-semibold text-foreground flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                Initial Message *
              </label>
              <Textarea
                id="content"
                placeholder="Share your thoughts, questions, or ideas to kickstart an amazing conversation... 💭"
                value={threadContent}
                onChange={(e) => setThreadContent(e.target.value)}
                className="min-h-40 bg-background/80 border-border/50 focus:border-primary resize-none transition-all duration-200 text-base leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs">
                <div className="text-muted-foreground flex items-center space-x-2">
                  <Smile className="h-3 w-3" />
                  <span>Tip: Be clear and engaging to encourage participation!</span>
                </div>
                <div className="text-muted-foreground">
                  {threadContent.length}/2000
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-border/20">
            <div className="flex justify-between items-center w-full">
              <div className="text-xs text-muted-foreground flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Required fields are marked with *
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setNewThreadDialogOpen(false)}
                  disabled={isSubmittingThread}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateThread}
                  disabled={!threadTitle.trim() || !threadContent.trim() || isSubmittingThread}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmittingThread ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Start Discussion
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscussionThreads;