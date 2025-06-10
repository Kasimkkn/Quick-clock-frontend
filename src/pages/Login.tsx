
import Layout from "@/components/layout/Layout";
import LoginForm from "@/components/auth/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const Login = () => {
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
      <div className="max-w-lg mx-auto py-12">
        <LoginForm />

        <p className="text-center mt-6 text-sm text-gray-600">
          Don't have an account? {" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </Layout>
  );
};

export default Login;
