import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

interface PasswordRequirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    key: "number",
    label: "One number",
    test: (password) => /\d/.test(password),
  },
  {
    key: "special",
    label: "One special character (!@#$%^&*)",
    test: (password) => /[!@#$%^&*]/.test(password),
  },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const metRequirements = requirements.filter((req) => req.test(password)).length;
  
  if (metRequirements === 0) return { score: 0, label: "Enter password", color: "bg-gray-400" };
  if (metRequirements <= 2) return { score: 25, label: "Weak", color: "bg-gray-800" };
  if (metRequirements <= 3) return { score: 50, label: "Fair", color: "bg-gray-700" };
  if (metRequirements <= 4) return { score: 75, label: "Good", color: "bg-gray-600" };
  return { score: 100, label: "Strong", color: "bg-gray-500" };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Password Strength</span>
          <span className={`text-sm font-medium ${
            strength.label === "Strong" ? "text-gray-300" :
            strength.label === "Good" ? "text-gray-400" :
            strength.label === "Fair" ? "text-gray-400" :
            strength.label === "Weak" ? "text-gray-500" : "text-gray-400"
          }`}>
            {strength.label}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`${strength.color} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        <p className="text-sm text-text-secondary font-medium">Requirements:</p>
        <div className="grid grid-cols-1 gap-1">
          {requirements.map((requirement) => {
            const isMet = requirement.test(password);
            return (
              <div
                key={requirement.key}
                className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                  isMet ? "text-green-400" : "text-text-muted-foreground"
                }`}
              >
                {isMet ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <X size={14} className="text-gray-500" />
                )}
                <span>{requirement.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}