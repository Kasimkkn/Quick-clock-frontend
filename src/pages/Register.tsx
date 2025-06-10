
import Layout from "@/components/layout/Layout";
import RegisterForm from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-8">
        <RegisterForm />
        
        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account? {" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </Layout>
  );
};

export default Register;
