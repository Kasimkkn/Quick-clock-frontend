import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";

const LoginForm = () => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // Validate on change for better UX
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  const isLoading = form.formState.isSubmitting;
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [fieldTouched, setFieldTouched] = useState({
    email: false,
    password: false,
  });

  // Check if the form is valid and complete
  const isFormValid = form.formState.isValid && fieldTouched.email && fieldTouched.password;

  const onSubmit = async (data: LoginFormData) => {
    if (!isFormValid) {
      setFormErrors("Please fill all required fields correctly");
      return;
    }
    
    setFormErrors(null);
    
    try {
      const response = await login(data.email, data.password);
      
      // Check if response is properly formed with user and token
      if (!response || !response.fullName) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid response from server. Please try again.",
        });
        return;
      }

      toast({
        title: "Login successful",
        description: `Welcome back, ${response.fullName}!`,
      });

      if (response.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      // Extract the error message if available
      const errorMessage = error.message || "Login failed. Please check your credentials and try again.";
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
      
      setFormErrors(errorMessage);
    }
  };

  const handleFieldChange = (field: keyof typeof fieldTouched) => {
    setFieldTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Login to QuickClock</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {formErrors && (
              <div className="p-3 rounded bg-red-50 text-red-500 text-sm">
                {formErrors}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("email");
                      }}
                      className={`${form.formState.errors.email ? "border-red-300" : ""}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("password");
                      }}
                      className={`${form.formState.errors.password ? "border-red-300" : ""}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full flex items-center justify-center"
              disabled={isLoading || !isFormValid}
              title={!isFormValid ? "Please fill all required fields correctly" : ""}
            >
              {isLoading ? "Logging in..." : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default LoginForm;
