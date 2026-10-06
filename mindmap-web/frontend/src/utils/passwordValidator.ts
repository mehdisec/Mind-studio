export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
  score: number; // 0 to 4
  strengthLabelKey: 'pwdStrengthWeak' | 'pwdStrengthMedium' | 'pwdStrengthStrong' | 'pwdStrengthVeryStrong';
  strengthColor: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const checks = [hasMinLength, hasUpper && hasLower, hasNumber, hasSpecial];
  const score = checks.filter(Boolean).length;
  const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  let strengthLabelKey: 'pwdStrengthWeak' | 'pwdStrengthMedium' | 'pwdStrengthStrong' | 'pwdStrengthVeryStrong' = 'pwdStrengthWeak';
  let strengthColor = 'bg-rose-500';

  if (score <= 1) {
    strengthLabelKey = 'pwdStrengthWeak';
    strengthColor = 'bg-rose-500';
  } else if (score === 2) {
    strengthLabelKey = 'pwdStrengthMedium';
    strengthColor = 'bg-amber-500';
  } else if (score === 3) {
    strengthLabelKey = 'pwdStrengthStrong';
    strengthColor = 'bg-sky-500';
  } else if (score >= 4 && isValid) {
    strengthLabelKey = 'pwdStrengthVeryStrong';
    strengthColor = 'bg-emerald-500';
  }

  return {
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isValid,
    score,
    strengthLabelKey,
    strengthColor,
  };
}
