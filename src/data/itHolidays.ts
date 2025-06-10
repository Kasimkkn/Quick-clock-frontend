
import { Holiday } from "@/types";

// Adding createdAt and updatedAt to match the Holiday interface
const currentDate = new Date().toISOString();

const itHolidays: Holiday[] = [
  { id: "1", name: "New Year's Day", date: "2025-01-01", description: "Celebration of the new year", createdAt: currentDate, updatedAt: currentDate },
  { id: "2", name: "Republic Day", date: "2025-01-26", description: "Indian Republic Day", createdAt: currentDate, updatedAt: currentDate },
  { id: "3", name: "Holi", date: "2025-03-14", description: "Festival of Colors", createdAt: currentDate, updatedAt: currentDate },
  { id: "4", name: "Good Friday", date: "2025-04-18", description: "Christian holiday", createdAt: currentDate, updatedAt: currentDate },
  { id: "5", name: "Labour Day", date: "2025-05-01", description: "International Workers' Day", createdAt: currentDate, updatedAt: currentDate },
  { id: "6", name: "Independence Day", date: "2025-08-15", description: "Indian Independence Day", createdAt: currentDate, updatedAt: currentDate },
  { id: "7", name: "Ganesh Chaturthi", date: "2025-08-27", description: "Festival of Lord Ganesha", createdAt: currentDate, updatedAt: currentDate },
  { id: "8", name: "Mahatma Gandhi Jayanti", date: "2025-10-02", description: "Birth anniversary of Mahatma Gandhi", createdAt: currentDate, updatedAt: currentDate },
  { id: "9", name: "Diwali", date: "2025-10-20", description: "Festival of Lights", createdAt: currentDate, updatedAt: currentDate },
  { id: "10", name: "Christmas", date: "2025-12-25", description: "Christmas Day", createdAt: currentDate, updatedAt: currentDate },
];
export default itHolidays;
