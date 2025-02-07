import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import "../styles/AuthForm.css";
import { signIn, signUp } from "../services/auth";
import { useAsyncFn } from "../hooks/useAsync";
import { useNavigate } from "react-router-dom";

export const AuthForm: React.FC = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const handleSignInFn = useAsyncFn(signIn);
  const handleSignUpFn = useAsyncFn(signUp);

  const signInEmailRef = React.useRef<HTMLInputElement>(null);
  const signInPasswordRef = React.useRef<HTMLInputElement>(null);
  const signUpFirstNameRef = React.useRef<HTMLInputElement>(null);
  const signUpLastNameRef = React.useRef<HTMLInputElement>(null);
  const signUpEmailRef = React.useRef<HTMLInputElement>(null);
  const signUpPasswordRef = React.useRef<HTMLInputElement>(null);
  const signUpConfirmPasswordRef = React.useRef<HTMLInputElement>(null);

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
    const email = signInEmailRef.current!.value;
    const password = signInPasswordRef.current!.value;

    if (!validateFields({ email, password })) {
      return;
    }

    const signInResponse = await handleSignInFn.execute({ email, password });

    if (signInResponse.message) {
      alert(signInResponse.message || "Sign In failed");
    } else {
      navigate("/posts");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = signUpFirstNameRef.current!.value;
    const lastName = signUpLastNameRef.current!.value;
    const email = signUpEmailRef.current!.value;
    const password = signUpPasswordRef.current!.value;
    const confirmPassword = signUpConfirmPasswordRef.current!.value;

    if (
      !validateFields({ firstName, lastName, email, password, confirmPassword })
    )
      return;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const signUpResponse = await handleSignUpFn.execute({
      firstName,
      lastName,
      email,
      password,
    });

    if (signUpResponse.message) {
      alert(signUpResponse.message || "Sign Up failed");
    }

    signUpFirstNameRef.current!.value = "";
    signUpLastNameRef.current!.value = "";
    signUpEmailRef.current!.value = "";
    signUpPasswordRef.current!.value = "";
    signUpConfirmPasswordRef.current!.value = "";

    alert("Sign Up successful");
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
            ref={signInEmailRef}
            type="email"
            placeholder="Email"
            className={`my-3 ${errors.email ? "invalid" : ""}`}
          />
          <Form.Control
            ref={signInPasswordRef}
            type="password"
            placeholder="Password"
            className={`my-3 ${errors.password ? "invalid" : ""}`}
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
            ref={signUpFirstNameRef}
            type="text"
            placeholder="First Name"
            className={`my-3 ${errors.firstName ? "invalid" : ""}`}
          />
          <Form.Control
            ref={signUpLastNameRef}
            type="text"
            placeholder="Last Name"
            className={`my-3 ${errors.lastName ? "invalid" : ""}`}
          />
          <Form.Control
            ref={signUpEmailRef}
            type="email"
            placeholder="Email"
            className={`my-3 ${errors.email ? "invalid" : ""}`}
          />
          <Form.Control
            ref={signUpPasswordRef}
            type="password"
            placeholder="Password"
            className={`my-3 ${errors.password ? "invalid" : ""}`}
          />
          <Form.Control
            ref={signUpConfirmPasswordRef}
            type="password"
            placeholder="Confirm Password"
            className={`my-3 ${errors.confirmPassword ? "invalid" : ""}`}
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
