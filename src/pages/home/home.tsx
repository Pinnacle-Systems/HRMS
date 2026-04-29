// src/pages/Home.tsx
import { useState, useEffect } from "react";
import {
  Grid,
  // Card,
  // CardContent,
  // Typography,
  // Box,
  // Button,
  // Avatar,
  // AvatarGroup,
  // LinearProgress,
  // Chip,
  // IconButton,
  // Table,
  // TableBody,
  // TableCell,
  // TableContainer,
  // TableHead,
  // TableRow,
  // Paper,
} from "@mui/material";
// import {
//   TrendingUp,
//   TrendingDown,
//   People,
//   Assignment,
//   AttachMoney,
//   EventNote,
//   CheckCircle,
//   Pending,
//   Cancel,
//   MoreVert,
// } from "@mui/icons-material";

export default function Home() {
  // const [stats, setStats] = useState({
  //   totalEmployees: 124,
  //   presentToday: 98,
  //   absentToday: 15,
  //   onLeave: 11,
  //   pendingLeaveRequests: 8,
  //   totalPayroll: 2450000,
  //   newHiresThisMonth: 5,
  //   resignationsThisMonth: 2,
  // });

  // const recentActivities = [
  //   {
  //     id: 1,
  //     user: "John Doe",
  //     action: "applied for leave",
  //     type: "leave",
  //     time: "10 minutes ago",
  //   },
  //   {
  //     id: 2,
  //     user: "Sarah Smith",
  //     action: "marked attendance",
  //     type: "attendance",
  //     time: "1 hour ago",
  //   },
  //   {
  //     id: 3,
  //     user: "Mike Johnson",
  //     action: "joined the company",
  //     type: "hire",
  //     time: "2 hours ago",
  //   },
  //   {
  //     id: 4,
  //     user: "Emily Brown",
  //     action: "submitted timesheet",
  //     type: "timesheet",
  //     time: "3 hours ago",
  //   },
  // ];

  // const upcomingBirthdays = [
  //   { id: 1, name: "Alice Walker", date: "Tomorrow", department: "HR" },
  //   { id: 2, name: "Bob Martin", date: "In 2 days", department: "Engineering" },
  //   { id: 3, name: "Carol White", date: "In 3 days", department: "Sales" },
  // ];

  // const pendingLeaves = [
  //   {
  //     id: 1,
  //     employee: "Robert Chen",
  //     dates: "May 15-17, 2026",
  //     type: "Sick Leave",
  //     days: 3,
  //   },
  //   {
  //     id: 2,
  //     employee: "Lisa Wang",
  //     dates: "May 20-22, 2026",
  //     type: "Vacation",
  //     days: 3,
  //   },
  //   {
  //     id: 3,
  //     employee: "David Kim",
  //     dates: "May 25, 2026",
  //     type: "Personal Day",
  //     days: 1,
  //   },
  // ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-gray-800">
          Welcome back, Admin!
          Here's what's happening with your workforce today.
      </div>

      {/* Statistics Cards */}
      <Grid container spacing={3}>
        {/* <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent>
              <Box className="flex justify-between items-start">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Employees
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {stats.totalEmployees}
                  </Typography>
                  <Box className="flex items-center mt-2">
                    <TrendingUp className="text-green-500 !w-4" />
                    <Typography variant="body2" className="text-green-500 ml-1">
                      +{stats.newHiresThisMonth}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" className="ml-1">
                      this month
                    </Typography>
                  </Box>
                </div>
                <People className="text-primary-300 !w-8 !h-8" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent>
              <Box className="flex justify-between items-start">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Today's Attendance
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {stats.presentToday}
                  </Typography>
                  <Box className="flex gap-2 mt-2">
                    <Typography variant="body2" className="text-green-500">
                      ✅ Present: {stats.presentToday}
                    </Typography>
                  </Box>
                  <Typography variant="body2" className="text-red-500">
                    ❌ Absent: {stats.absentToday}
                  </Typography>
                </div>
                <Assignment className="text-blue-300 !w-8 !h-8" />
              </Box>
              <Box className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Attendance Rate</span>
                  <span>
                    {Math.round(
                      (stats.presentToday / stats.totalEmployees) * 100
                    )}
                    %
                  </span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={(stats.presentToday / stats.totalEmployees) * 100}
                  className="h-2"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent>
              <Box className="flex justify-between items-start">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Leave Requests
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {stats.pendingLeaveRequests}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Approval
                  </Typography>
                  <Box className="flex items-center mt-2">
                    <Typography variant="body2" className="text-orange-500">
                      {stats.onLeave} on leave today
                    </Typography>
                  </Box>
                </div>
                <EventNote className="text-orange-300 !w-8 !h-8" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent>
              <Box className="flex justify-between items-start">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Monthly Payroll
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    ₹{(stats.totalPayroll / 100000).toFixed(1)}L
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Salary Budget
                  </Typography>
                </div>
                <AttachMoney className="text-green-300 !w-8 !h-8" />
              </Box>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        {/* <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-bold mb-3">
                Recent Activities
              </Typography>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <Box
                    key={activity.id}
                    className="flex items-center justify-between pb-3 border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="!w-8 !h-8 !bg-primary-100 !text-primary-600">
                        {activity.user.charAt(0)}
                      </Avatar>
                      <div>
                        <Typography variant="body2" className="font-medium">
                          {activity.user}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {activity.action} • {activity.time}
                        </Typography>
                      </div>
                    </div>
                    <Chip
                      label={activity.type}
                      size="small"
                      className="bg-gray-100"
                    />
                  </Box>
                ))}
              </div>
              <Button
                size="small"
                className="mt-3 text-primary-600"
                onClick={() => console.log("View all")}
              >
                View All Activities →
              </Button>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Upcoming Birthdays */}
        {/* <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-bold mb-3">
                🎂 Upcoming Birthdays
              </Typography>
              <div className="space-y-3">
                {upcomingBirthdays.map((birthday) => (
                  <Box
                    key={birthday.id}
                    className="flex items-center justify-between pb-3 border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="!w-8 !h-8 !bg-pink-100 !text-pink-600">
                        {birthday.name.charAt(0)}
                      </Avatar>
                      <div>
                        <Typography variant="body2" className="font-medium">
                          {birthday.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {birthday.department}
                        </Typography>
                      </div>
                    </div>
                    <Chip
                      label={birthday.date}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                ))}
              </div>
              <Button
                size="small"
                className="mt-3 text-primary-600"
                onClick={() => console.log("View all")}
              >
                View All Birthdays →
              </Button>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Pending Leave Requests */}
        {/* <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-bold mb-3">
                Pending Leave Requests
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Dates</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingLeaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">
                          {leave.employee}
                        </TableCell>
                        <TableCell>{leave.dates}</TableCell>
                        <TableCell>{leave.type}</TableCell>
                        <TableCell>{leave.days}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            className="mr-1 !text-xs"
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            className="!text-xs"
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Quick Actions / Shortcuts */}
        {/* <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-bold mb-3">
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    className="!py-3 !normal-case"
                    startIcon={<People />}
                    onClick={() => console.log("Add Employee")}
                  >
                    Add Employee
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    className="!py-3 !normal-case"
                    startIcon={<EventNote />}
                    onClick={() => console.log("Apply Leave")}
                  >
                    Apply Leave
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    className="!py-3 !normal-case"
                    startIcon={<Assignment />}
                    onClick={() => console.log("Mark Attendance")}
                  >
                    Mark Attendance
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    className="!py-3 !normal-case"
                    startIcon={<AttachMoney />}
                    onClick={() => console.log("Process Payroll")}
                  >
                    Process Payroll
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Department Distribution */}
        {/* <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-bold mb-3">
                Department Distribution
              </Typography>
              <Grid container spacing={3}>
                {[
                  { name: "Engineering", count: 45, color: "bg-blue-500" },
                  { name: "Sales", count: 28, color: "bg-green-500" },
                  { name: "HR", count: 12, color: "bg-purple-500" },
                  { name: "Marketing", count: 18, color: "bg-orange-500" },
                  { name: "Finance", count: 15, color: "bg-red-500" },
                  { name: "Operations", count: 6, color: "bg-teal-500" },
                ].map((dept) => (
                  <Grid item xs={6} sm={4} md={2} key={dept.name}>
                    <Box className="text-center">
                      <div className="relative inline-block">
                        <div
                          className={`w-20 h-20 ${dept.color} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto`}
                        >
                          {dept.count}
                        </div>
                      </div>
                      <Typography variant="body2" className="mt-2 font-medium">
                        {dept.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {Math.round((dept.count / stats.totalEmployees) * 100)}%
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>
    </div>
  );
}