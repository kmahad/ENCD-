import { useState } from "react";
import { passwordStrength } from "../utils";

interface PasswordInputProps {
  password: string;
  confirmPassword?: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange?: (value: string) => void;
  showConfirm?: boolean;
  disabled?: boolean;
}
export function PasswordInput({
  password,
  confirmPassword = "",
  onPasswordChange,
  onConfirmChange,
  showConfirm = false,
  disabled,
}: PasswordInputProps) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const strength = passwordStrength(password);
  const mismatch =
    showConfirm && confirmPassword.length > 0 && password !== confirmPassword;

  const EyeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

  return (
    <div className="password-group">
      <div
        className={`password-grid ${showConfirm ? "password-grid--split" : ""}`}
      >
        <div className="field">
          <span className="field__label">ENTER MASTER PASSWORD</span>
          <div className="field__input-wrapper">
            <input
              type={showPass ? "text" : "password"}
              className="field__input"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter Master Password"
              disabled={disabled}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="field__toggle-visibility"
              onClick={() => setShowPass(!showPass)}
              disabled={disabled}
              tabIndex={-1}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {showConfirm && (
          <div className="field">
            <span className="field__label">CONFIRM PASSWORD</span>
            <div className="field__input-wrapper">
              <input
                type={showConfirmPass ? "text" : "password"}
                className="field__input"
                value={confirmPassword}
                onChange={(e) => onConfirmChange?.(e.target.value)}
                placeholder="Confirm Password"
                disabled={disabled}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="field__toggle-visibility"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                disabled={disabled}
                tabIndex={-1}
                aria-label={showConfirmPass ? "Hide password" : "Show password"}
              >
                {showConfirmPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {mismatch && (
              <span className="field__error">Passwords do not match</span>
            )}
          </div>
        )}
      </div>

      {password.length > 0 && (
        <div className="strength-container">
          <div className="strength-header">
            <span className="strength-label">PASSWORD STRENGTH</span>
            <span
              className={`strength-value strength-value--${strength.level}`}
            >
              {strength.label}
            </span>
          </div>
          <div className="strength-bar-track">
            <div
              className={`strength-bar-fill strength-bar-fill--${strength.level}`}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
          <span className="strength-hint">{strength.hint}</span>
        </div>
      )}
    </div>
  );
}
