
import Layout from "@/components/layout/Layout"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleCheck,
  Clock,
  Fingerprint,
  QrCode,
  Shield,
  Smartphone,
  UserRoundSearch
} from "lucide-react"
import { Link } from "react-router-dom"

const Index = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <div className="hero-gradient text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                QuickClock: Modern Attendance Tracking
              </h1>
              <p className="text-xl mb-8 opacity-90 max-w-lg">
                Streamline your workforce management with our cutting-edge QR-based attendance system
              </p>
            </div>

            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden transform rotate-3">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-blue-500 rounded-full p-2">
                        <QrCode className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="ml-3 text-lg font-semibold text-gray-800">Quick Attendance</h3>
                    </div>
                    <p className="mt-3 text-gray-600">Scan your unique QR code to instantly record attendance</p>
                  </div>
                </div>

                <div className="absolute top-14 -right-2 bg-white rounded-lg shadow-xl overflow-hidden transform -rotate-2">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-green-500 rounded-full p-2">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="ml-3 text-lg font-semibold text-gray-800">Record Tracking</h3>
                    </div>
                    <p className="mt-3 text-gray-600">Access comprehensive attendance history with a single click</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to streamline attendance tracking and improve workforce management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="feature-card bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center">
              <div className="feature-icon bg-blue-50 rounded-full p-3 mb-4">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">QR-Based Check-In</h3>
              <p className="text-gray-600 text-center">
                Scan your personal QR code ID to mark attendance without physical contact
              </p>
            </div>

            <div className="feature-card bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center">
              <div className="feature-icon bg-green-50 rounded-full p-3 mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-600 text-center">
                Access attendance reports and insights for better workforce management
              </p>
            </div>

            <div className="feature-card bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center">
              <div className="feature-icon bg-orange-50 rounded-full p-3 mb-4">
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tamper-proof Records</h3>
              <p className="text-gray-600 text-center">
                Secure attendance tracking that prevents buddy punching and time theft
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-white p-8 rounded-lg shadow-sm border mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Register Account</h3>
                <p className="text-gray-600 text-sm">Create your employee profile</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-700 font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Generate ID Card</h3>
                <p className="text-gray-600 text-sm">Access your personal QR code ID</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-300 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-800 font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Scan to Check In/Out</h3>
                <p className="text-gray-600 text-sm">Mark attendance with a simple scan</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold">4</span>
                </div>
                <h3 className="font-medium mb-2">Track Records</h3>
                <p className="text-gray-600 text-sm">Access your attendance history</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Use QuickClock?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our attendance system helps you save time, increase accuracy, and improve workforce management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-8 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">For Employees</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Quick and contactless check-in and check-out</span>
                </li>
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Easily view your attendance history and work hours</span>
                </li>
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>No more paper timesheets or manual sign-in</span>
                </li>
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Works on any smartphone with a camera</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">For Administrators</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Real-time visibility of employee attendance</span>
                </li>
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Eliminate buddy punching and time theft</span>
                </li>
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Generate comprehensive attendance reports</span>
                </li>
                <li className="flex items-start">
                  <CircleCheck className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Easy employee onboarding and management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Future Features Section */}
      <div className="future-section-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We're continuously improving QuickClock with new features to enhance your experience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="feature-card bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center">
              <div className="feature-icon bg-indigo-50 rounded-full p-3 mb-4">
                <Fingerprint className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fingerprint Authentication</h3>
              <p className="text-gray-600 text-center text-sm">
                Secure biometric verification for foolproof attendance
              </p>
            </div>

            <div className="feature-card bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center">
              <div className="feature-icon bg-pink-50 rounded-full p-3 mb-4">
                <UserRoundSearch className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Facial Recognition</h3>
              <p className="text-gray-600 text-center text-sm">
                Contactless check-in using advanced facial recognition
              </p>
            </div>

            <div className="feature-card bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center">
              <div className="feature-icon bg-amber-50 rounded-full p-3 mb-4">
                <Smartphone className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile App</h3>
              <p className="text-gray-600 text-center text-sm">
                Native mobile application for iOS and Android
              </p>
            </div>

            <div className="feature-card bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center">
              <div className="feature-icon bg-emerald-50 rounded-full p-3 mb-4">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Work Hour Analytics</h3>
              <p className="text-gray-600 text-center text-sm">
                Advanced reporting and productivity insights
              </p>
            </div>
          </div>

          <div className="text-center">
            {!isAuthenticated && (
              <Link to="/register">
                <Button size="lg">
                  Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Index
