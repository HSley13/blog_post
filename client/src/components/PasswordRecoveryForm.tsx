import React, { useState, useEffect } from "react";
import { Form, Button, Container, Card } from "react-bootstrap";
import { passwordForgotten } from "../services/auth";
import { useAsyncFn } from "../hooks/useAsync";
import "../styles/AuthForm.css";

export const PasswordRecoveryForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const passwordForgottenFn = useAsyncFn(passwordForgotten);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const validateFields = (fields: Record<string, string>) => {
    const newErrors: Record<string, boolean> = {};
    Object.keys(fields).forEach((key) => {
      newErrors[key] = !fields[key];
    });

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields({ email, code })) {
      return;
    }

    if (timeLeft <= 0) {
      alert("Time is up! Please request a new code.");
      return;
    }

    alert(`Email: ${email}, Code: ${code}`);
    console.log("Submitting:", { email, code });
    // send email and code to backend
  };

  const handleSendCode = async () => {
    if (!validateFields({ email })) {
      return;
    }

    const response = await passwordForgottenFn.execute({ email });

    if (response.message) {
      alert(response.message);
      setIsTimerActive(true);
    } else {
      alert(response.error);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card
        className="p-4 shadow-sm"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <h2 className="text-center mb-4">Password Recovery</h2>
        <Form onSubmit={handleSubmit}>
          {!isTimerActive && (
            <Form.Control
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`my-3 ${errors.email ? "invalid" : ""}`}
              required
            />
          )}

          {isTimerActive && (
            <Form.Control
              name="code"
              type="text"
              placeholder="Enter the code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`my-3 ${errors.code ? "invalid" : ""}`}
              required
            />
          )}

          <div className="mb-3">
            <p
              className={`fw-bold ${timeLeft <= 0 ? "text-danger" : "text-dark"}`}
            >
              Time remaining: {formatTime(timeLeft)}
            </p>
          </div>

          {!isTimerActive && (
            <Button
              variant="primary"
              onClick={handleSendCode}
              className="w-100 mb-3"
            >
              Send Code
            </Button>
          )}

          {isTimerActive && (
            <Button
              type="submit"
              variant="success"
              disabled={timeLeft <= 0}
              className="w-100"
            >
              Submit
            </Button>
          )}
        </Form>
      </Card>
    </Container>
  );
};
