
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectUpdates from "@/components/collaboration/ProjectUpdates";
import DiscussionThreads from "@/components/collaboration/DiscussionThreads";
import MeetingScheduler from "@/components/collaboration/MeetingScheduler";
import DocumentSharing from "@/components/collaboration/DocumentSharing";
import {
  MessageSquare,
  FileText,
  Calendar,
  FolderKanban
} from "lucide-react";

const TeamCollaborationPage = () => {
  const [activeTab, setActiveTab] = useState("updates");

  return (
    <Layout>
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Collaboration Space</h1>
          <p className="text-muted-foreground mt-2">
            Collaborate with your team, share updates, schedule meetings, and manage documents
          </p>
        </div>

        <Tabs defaultValue="updates" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 md:w-[600px]">
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span className="hidden sm:inline">Project Updates</span>
            </TabsTrigger>
            <TabsTrigger value="discussions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Discussions</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Meetings</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="updates" className="space-y-4">
              <ProjectUpdates />
            </TabsContent>

            <TabsContent value="discussions" className="space-y-4">
              <DiscussionThreads />
            </TabsContent>

            <TabsContent value="meetings" className="space-y-4">
              <MeetingScheduler />
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <DocumentSharing />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeamCollaborationPage;
