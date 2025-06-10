
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeAttendanceHistory from "@/components/attendance/EmployeeAttendanceHistory";

const MyAttendancePage = () => {
  return (
    <Layout>
      <EmployeeAttendanceHistory />
    </Layout>
  );
};

export default MyAttendancePage;
