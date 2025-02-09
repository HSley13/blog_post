import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import "../styles/AuthForm.css";
import { signIn, signUp } from "../services/auth";
import { useAsyncFn } from "../hooks/useAsync";
import { useNavigate } from "react-router-dom";

interface AuthFormState {
  signInEmail: string;
  signInPassword: string;
  signUpFirstName: string;
  signUpLastName: string;
  signUpEmail: string;
  signUpPassword: string;
  signUpConfirmPassword: string;
}

export const AuthForm: React.FC = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const handleSignInFn = useAsyncFn(signIn);
  const handleSignUpFn = useAsyncFn(signUp);

  const [formState, setFormState] = useState<AuthFormState>({
    signInEmail: "",
    signInPassword: "",
    signUpFirstName: "",
    signUpLastName: "",
    signUpEmail: "",
    signUpPassword: "",
    signUpConfirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validateFields = (fields: Record<string, string>) => {
    const newErrors: Record<string, boolean> = {};
    Object.keys(fields).forEach((key) => {
      newErrors[key] = !fields[key];
    });

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !validateFields({
        signInEmail: formState.signInEmail,
        signInPassword: formState.signInPassword,
      })
    ) {
      return;
    }

    const signInResponse = await handleSignInFn.execute({
      email: formState.signInEmail,
      password: formState.signInPassword,
    });

    if (signInResponse.message) {
      alert(signInResponse.message || "Sign In failed");
    } else {
      navigate("/posts");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !validateFields({
        signUpFirstName: formState.signUpFirstName,
        signUpLastName: formState.signUpLastName,
        signUpEmail: formState.signUpEmail,
        signUpPassword: formState.signUpPassword,
        signUpConfirmPassword: formState.signUpConfirmPassword,
      })
    ) {
      return;
    }

    if (formState.signUpPassword !== formState.signUpConfirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const signUpResponse = await handleSignUpFn.execute({
      firstName: formState.signUpFirstName,
      lastName: formState.signUpLastName,
      email: formState.signUpEmail,
      password: formState.signUpPassword,
    });

    if (signUpResponse.message) {
      alert(signUpResponse.message || "Sign Up failed");
    } else {
      alert("Sign Up successful");
      setFormState({
        signInEmail: "",
        signInPassword: "",
        signUpFirstName: "",
        signUpLastName: "",
        signUpEmail: "",
        signUpPassword: "",
        signUpConfirmPassword: "",
      });
    }
  };

  return (
    <div
      className={`auth-container ${isRightPanelActive ? "right-panel-active" : ""}`}
    >
      <div className="form-container sign-in-container">
        <Form className="m-3 align-items-center" onSubmit={handleSignIn}>
          <h1>Sign in</h1>
          <span>or use your account</span>
          <Form.Control
            name="signInEmail"
            type="email"
            placeholder="Email"
            value={formState.signInEmail}
            onChange={handleInputChange}
            className={`my-3 ${errors.signInEmail ? "invalid" : ""}`}
          />
          <Form.Control
            name="signInPassword"
            type="password"
            placeholder="Password"
            value={formState.signInPassword}
            onChange={handleInputChange}
            className={`my-3 ${errors.signInPassword ? "invalid" : ""}`}
          />
          <div className="d-flex justify-content-end">
            <a href="#" style={{ fontSize: "0.7rem" }}>
              Forgot your password?
            </a>
          </div>
          <div className="d-flex align-items-center justify-content-end my-3">
            <Button variant="primary" type="submit">
              Sign In
            </Button>
          </div>
        </Form>
      </div>

      <div className="form-container sign-up-container">
        <Form className="m-3" onSubmit={handleSignUp}>
          <h1>Sign up</h1>
          <span>or use your email for registration</span>
          <Form.Control
            name="signUpFirstName"
            type="text"
            placeholder="First Name"
            value={formState.signUpFirstName}
            onChange={handleInputChange}
            className={`my-3 ${errors.signUpFirstName ? "invalid" : ""}`}
          />
          <Form.Control
            name="signUpLastName"
            type="text"
            placeholder="Last Name"
            value={formState.signUpLastName}
            onChange={handleInputChange}
            className={`my-3 ${errors.signUpLastName ? "invalid" : ""}`}
          />
          <Form.Control
            name="signUpEmail"
            type="email"
            placeholder="Email"
            value={formState.signUpEmail}
            onChange={handleInputChange}
            className={`my-3 ${errors.signUpEmail ? "invalid" : ""}`}
          />
          <Form.Control
            name="signUpPassword"
            type="password"
            placeholder="Password"
            value={formState.signUpPassword}
            onChange={handleInputChange}
            className={`my-3 ${errors.signUpPassword ? "invalid" : ""}`}
          />
          <Form.Control
            name="signUpConfirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={formState.signUpConfirmPassword}
            onChange={handleInputChange}
            className={`my-3 ${errors.signUpConfirmPassword ? "invalid" : ""}`}
          />
          <div className="d-flex align-items-center justify-content-end my-3">
            <Button variant="primary" type="submit">
              Sign Up
            </Button>
          </div>
        </Form>
      </div>

      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <p>
              To keep connected with us, please login with your personal info
            </p>
            <Button
              variant="outline-light"
              className="ghost"
              onClick={() => setIsRightPanelActive(false)}
            >
              Sign In
            </Button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <p>Enter your personal details and start your journey with us</p>
            <Button
              variant="outline-light"
              className="ghost"
              onClick={() => setIsRightPanelActive(true)}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
