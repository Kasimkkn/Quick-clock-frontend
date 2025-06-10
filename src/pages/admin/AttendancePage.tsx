
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AttendanceLog from "@/components/attendance/AttendanceLog";

const AttendancePage = () => {
  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceLog />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default AttendancePage;
