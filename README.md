
# Attendance Management System

A comprehensive attendance management system built with React, TypeScript, and Tailwind CSS. This application helps organizations track employee attendance, manage leaves, schedule meetings, and facilitate team collaboration.

## Features

### Core Functionality
- **Employee Attendance Tracking**: Check-in and check-out with geolocation
- **Leave Management**: Apply for and manage different types of leaves
- **Manual Attendance Requests**: Request corrections to attendance records
- **Admin Dashboard**: Comprehensive overview of organizational metrics
- **Holiday Calendar**: Keep track of holidays and important dates
- **Geofencing**: Location-based attendance validation

### Team Collaboration Space (New!)
- **Project Updates**: Share progress and announcements for team projects
- **Discussion Threads**: Create and participate in team discussions
- **Meeting Scheduler**: Schedule and manage team meetings with calendar integration
- **Document Sharing**: Upload, share, and manage documents with team members

## Technical Stack

- React with TypeScript
- Tailwind CSS for styling
- Shadcn/UI component library
- TanStack Query for data fetching and caching
- React Router for navigation
- Date-fns for date manipulation
- Cloudinary for document storage and management
- Recharts for data visualization

## Installation & Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with required environment variables
4. Run the development server with `npm run dev`

## Environment Variables

```
REACT_APP_API_URL=http://localhost:3000/api
CLOUDINARY_NAME=dzwspepvg
CLOUDINARY_API_KEY=474749346445152
```

## Deployment

The application can be built for production using:

```
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
