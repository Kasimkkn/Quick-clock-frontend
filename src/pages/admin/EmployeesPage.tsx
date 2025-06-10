
import RegisterForm from "@/components/auth/RegisterForm";
import EmployeeList from "@/components/employees/EmployeeList";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const EmployeesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Layout>
      <Card>
        <CardHeader className="pb-3 flex justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Employee Management</CardTitle>
            <Button
              onClick={() => setDialogOpen(true)}
            >Add Employee</Button>
          </div>
        </CardHeader>
        <CardContent>
          <EmployeeList />
        </CardContent>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <ScrollArea className="h-[600px]">
              <RegisterForm />
            </ScrollArea>
          </DialogContent>
        </Dialog>

      </Card>
    </Layout>
  );
};

export default EmployeesPage;
